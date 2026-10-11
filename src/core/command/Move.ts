import { Line } from '../shapes/line/Line'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Shortcut } from './Command'

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

export class MoveCommand extends Command<Params> {
    readonly name = 'move'
    readonly shortcuts = [...arrows(STEP, false), ...arrows(BIG_STEP, true)]

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx)
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { dx, dy } = ctx.params
        const { widgets } = ctx

        // like dragging: a line that moves too isn't pulled by its bindings
        const lines = new Set<string>()
        const editTable = new Map<Widget, EditingMethods[]>()
        widgets.forEach((widget) => {
            editTable.set(widget, ['move'])
            if (widget instanceof Line) lines.add(widget.uuid!)
        })

        this.edit(ctx, editTable, () => {
            if (!dx && !dy) return false

            widgets.forEach((widget) => {
                widget.move(widget.left + dx, widget.top + dy, { lines })
            })
            return true
        })
    }
}
