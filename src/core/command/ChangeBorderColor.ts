import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Path } from '../shapes/path/Path'
import { Line } from '@/core/shapes/line/Line'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { color: RGBA }

export class ChangeBorderColor extends Command<Params> {
    readonly name = 'changeBorderColor'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeBorderColor())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { color } = ctx.params
        const { widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is Shape | Path | Line =>
                widget.canChangeBorderColor() &&
                (widget instanceof Shape ||
                    widget instanceof Path ||
                    widget instanceof Line),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['borderColor'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeBorderColor(color)) changed = true
            }
            return changed
        })
    }
}
