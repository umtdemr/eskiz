import { BorderStyle } from '@/helpers/Constant'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Line } from '../shapes/line/Line'
import { Command, CommandCtx } from './Command'
import { EditingMethods } from '../transaction/State'

type Params = { border: BorderStyle }

export class ChangeBorderStyle extends Command<Params> {
    readonly name = 'changeBorderStyle'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeBorderStyle())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { widgets } = ctx
        const { border } = ctx.params

        const targets = widgets.filter(
            (widget): widget is Shape | Line =>
                widget.canChangeBorderStyle() &&
                (widget instanceof Shape || widget instanceof Line),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['borderStyle'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeBorderStyle(border)) changed = true
            }
            return changed
        })
    }
}
