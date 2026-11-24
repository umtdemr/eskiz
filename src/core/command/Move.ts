import { Line } from '../shapes/line/Line'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Shortcut } from './Command'
import { GRID_SIZE } from '../canvas/grid'

type Params = { dx: number; dy: number }

const STEP = 1
const BIG_STEP = 10

const arrows = (step: number, shift: boolean): Shortcut<Params>[] =>
    [
        { key: 'ArrowLeft', params: { dx: -step, dy: 0 } },
        { key: 'ArrowRight', params: { dx: step, dy: 0 } },
        { key: 'ArrowUp', params: { dx: 0, dy: -step } },
        { key: 'ArrowDown', params: { dx: 0, dy: step } },
    ].map((shortcut) => ({ ...shortcut, shift, continuous: true }))

// the move from `from` by `d`, carried on to the next grid line that way
const toGrid = (from: number, d: number) => {
    if (!d) return 0
    const to = from + d
    const line = d > 0 ? Math.ceil(to / GRID_SIZE) : Math.floor(to / GRID_SIZE)
    return line * GRID_SIZE - from
}

export class MoveCommand extends Command<Params> {
    readonly name = 'move'
    readonly shortcuts = [...arrows(STEP, false), ...arrows(BIG_STEP, true)]

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx)
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { widgets } = ctx

        // like dragging: a line that moves too isn't pulled by its bindings
        const lines = new Set<string>()
        const editTable = new Map<Widget, EditingMethods[]>()
        widgets.forEach((widget) => {
            editTable.set(widget, ['move'])
            if (widget instanceof Line) lines.add(widget.uuid!)
        })

        this.edit(ctx, editTable, () => {
            let { dx, dy } = ctx.params
            if (!dx && !dy) return false

            // the top left of the selection lands on the grid
            if (ctx.engine.settings.isGridSnapEnabled) {
                dx = toGrid(Math.min(...widgets.map((w) => w.left)), dx)
                dy = toGrid(Math.min(...widgets.map((w) => w.top)), dy)
            }

            widgets.forEach((widget) => {
                widget.move(widget.left + dx, widget.top + dy, { lines })
            })
            return true
        })
    }
}
