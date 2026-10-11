---
description: How to add a new command
---

# How to Add a New Command

Commands are the only way to change board state (create, delete, move, style), so undo/redo and sync keep working. This workflow shows how to add one.

The examples use a made-up `changeOpacity` command that would fade a whole widget. It doesn't exist; per-color transparency already works through the alpha channel of `RGBA` (e.g. `changeBgColor`).

## Rules

- **Commands are stateless.** No instance fields that change between calls (no `transactionId`, no timers). One instance lives in the registry and is shared by everyone.
- **Undo comes from transactions, not from `undo()`.** `TransactionHandler.begin()` captures the widget state before the change, `commit()` captures it after. There is no `undo()` method on commands.
- **Begin before you change.** If the widget changes before `begin()`, the "before" state is already the new value and undo does nothing. `this.edit()` handles this ordering for you.
- **Continuous edits go through `ContinuousEdits`.** Slider and color picker drags call the command many times. `this.edit()` groups those calls into one transaction per command + widget set and commits after `CONTINUOUS_THROTTLE_DELAY`, or right away when undo/redo runs or another transaction begins on the same widgets. Don't keep your own timer.

## 1. Add the Name and Params

Add the command to `CommandParams` in `src/core/command/Command.ts`. The key is the command name (`Commands` is derived from it) and the value is what the command takes besides the widgets. Use `NoParams` when it takes nothing.

```typescript
export type CommandParams = {
    delete: NoParams
    // ...
    changeOpacity: { opacity: number }
}
```

## 2. Create the Command Class

Create `src/core/command/ChangeOpacity.ts`. Most property changes follow this shape:

```typescript
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeOpacity extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        const opacity = ctx.params?.opacity as number
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets.length || opacity === undefined) return

        const targets = widgets.filter(
            (widget): widget is Shape => widget instanceof Shape,
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['opacity'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeOpacity(opacity)) changed = true
            }
            return changed
        })
    }
}
```

What `this.edit(ctx, editTable, change)` does:

- `ctx.isContinuous` is true: joins the open edit for this command and these widgets, or starts one. The edit is committed once the calls stop.
- Otherwise: runs `begin` → `change` → `commit` in a single transaction. `begin` commits any open continuous edit on the same widgets first, whatever command it belongs to.
- `change` must return whether anything actually changed. When it returns false nothing is rendered. An immediate edit then stays out of the history; a continuous one stays out only if none of its calls changed anything.

Commands that don't fit `this.edit()` (delete, toggle lock, z-index) call `ctx.engine.transactionHandler.begin()` / `commit()` themselves. They still call `begin` before changing anything. Commands that create widgets (clone) don't use a transaction; they push a `CreationHistoryEntry` to the history instead.

## 3. Make the State Restorable

Each name in the edit table is an `EditingMethods` entry in `src/core/transaction/State.ts`. For a new kind of change:

1. Add the name to `EditingMethods`.
2. Add a `case` to `getPartialState` that reads the value from the widget.
3. Copy objects with `structuredClone`. If the state holds a reference to an object that the change later mutates, the "before" state changes with it and undo breaks.
4. Record only the fields the change touches. Shape text goes into `textProperties`, so `fontSize` records `{ textProperties: { fontSize } }`, not the whole object. A wider snapshot makes undo bring back text or styles that changed in between.
5. Make sure the widget's `updateWithPartialState` can apply that state back, since undo/redo and sync both use it.
6. Sync sends this same partial state, and the db merges `properties` one level deep, with `textProperties` merged one more level. Any other nested object inside `properties` gets replaced, so record it whole.

## 4. Register It

Register it in `registerAllCommands()` in `src/core/command/CommandRegistry.ts`:

```typescript
this.registerCommand('changeOpacity', new ChangeOpacity('changeOpacity'))
```

## 5. Call It from the UI

Call it through `engine.execute`. It builds the ctx, targets the current selection, and returns `false` when `canExecute` fails, so the UI doesn't need its own `canAllChangeX()` check:

```typescript
const executed = engine.execute(
    'changeOpacity',
    { opacity },
    { continuous: true }, // while dragging a slider, leave out for a single click
)
if (!executed) return

// UI side effects (preview color, closing the dropdown) go after this
```

Pass `widgets` in the options to target something other than the selection, e.g. `engine.execute('delete', {}, { widgets })` for widgets removed by the eraser.

For a plain button in the sub-toolbar, add a `btnAction` entry instead (see `add_subtoolbar_action.md`). `Subtoolbar.tsx` runs it with `engine.execute`.

## 6. Test It

Add `src/core/command/__tests__/ChangeOpacity.test.ts` and use the helpers in `src/test/commandUtils.ts`:

- `createEngineMock()` records the transaction calls (`tx-1`, `tx-2`, ...) and uses a real `ContinuousEdits`. Its `begin` dispatches `beginning` like the real one, so open edits on the same widgets get committed.
- `createHistoryEngine()` uses the real `TransactionHandler` and `HistoryManager`. Use it when the order of undo/redo matters.
- `createCommandCtx(engine, { selected, isContinuous, params })` builds the ctx around a real `SelectionService`.
- `makeRect`, `makeLine`, `makePen` and `makeTextBox` build real widgets.

Cover at least:

- `canExecute`: nothing selected, a locked widget, an unsupported widget.
- The change itself and the edit table passed to `begin`.
- `begin` is called before the value changes (read the value inside a `begin.mockImplementation`).
- For continuous commands: calls join one transaction, it commits after `CONTINUOUS_THROTTLE_DELAY` (use `vi.useFakeTimers()`), an immediate call commits the open edit first, and an edit that changed nothing commits with `false`.

`ChangeRoundness.test.ts` covers all of these and is a good starting point. Then run `npx tsc -b`, `pnpm lint` and `pnpm vitest run`.
