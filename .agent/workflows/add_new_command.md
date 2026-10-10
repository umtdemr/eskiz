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
- **Continuous edits go through `ContinuousEdits`.** Slider and color picker drags call the command many times. `this.edit()` groups those calls into one transaction per command + widget set and commits after `CONTINUOUS_THROTTLE_DELAY`. Don't keep your own timer.

## 1. Add the Name

Add the command name to the `Commands` union in `src/core/command/Command.ts`:

```typescript
export type Commands =
    | 'delete'
    // ...
    | 'changeOpacity'
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
- Otherwise: commits any open continuous edit on the same widgets, then runs `begin` → `change` → `commit` in a single transaction.
- `change` must return whether anything actually changed. When it returns false nothing is rendered and nothing goes into the history.

Commands that don't edit widget properties (delete, clone, z-index) call `ctx.engine.transactionHandler.begin()` / `commit()` themselves. They still call `begin` before changing anything.

## 3. Make the State Restorable

Each name in the edit table is an `EditingMethods` entry in `src/core/transaction/State.ts`. For a new kind of change:

1. Add the name to `EditingMethods`.
2. Add a `case` to `getPartialState` that reads the value from the widget.
3. Copy objects with `structuredClone`. If the state holds a reference to an object that the change later mutates, the "before" state changes with it and undo breaks.
4. Make sure the widget's `updateWithPartialState` can apply that state back, since undo/redo and sync both use it.

## 4. Register It

Register it in `registerAllCommands()` in `src/core/command/CommandRegistry.ts`:

```typescript
this.registerCommand('changeOpacity', new ChangeOpacity('changeOpacity'))
```

## 5. Call It from the UI

Get the shared instance from the engine. Don't create the command with `new` or keep it in a `useRef`.

```typescript
const selectionService = engine.getService<SelectionService>('selection')
const ctx: CommandCtx = {
    selectionService,
    engine,
    isContinuous: true, // while dragging a slider, false for a single click
    params: {
        widgets: selectionService.selected,
        opacity,
    },
}

engine.getCommand('changeOpacity').execute(ctx)
```

For a plain button in the sub-toolbar, add a `btnAction` entry instead (see `add_subtoolbar_action.md`). `Subtoolbar.tsx` calls `engine.getCommand(...)` with the selected widgets.

## 6. Test It

Add `src/core/command/__tests__/ChangeOpacity.test.ts` and use the helpers in `src/test/commandUtils.ts`:

- `createEngineMock()` records the transaction calls (`tx-1`, `tx-2`, ...) and uses a real `ContinuousEdits`.
- `createCommandCtx(engine, { selected, isContinuous, params })` builds the ctx around a real `SelectionService`.
- `makeRect`, `makeLine`, `makePen` and `makeTextBox` build real widgets.

Cover at least:

- `canExecute`: nothing selected, a locked widget, an unsupported widget.
- The change itself and the edit table passed to `begin`.
- `begin` is called before the value changes (read the value inside a `begin.mockImplementation`).
- For continuous commands: calls join one transaction, it commits after `CONTINUOUS_THROTTLE_DELAY` (use `vi.useFakeTimers()`), and an immediate call commits the open edit first.

`ChangeRoundness.test.ts` covers all of these and is a good starting point. Then run `npx tsc -b`, `pnpm lint` and `pnpm vitest run`.
