import { Rectangle } from '../shapes/Rectangle'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { roundness: number }

export class ChangeRoundness extends Command<Params> {
    readonly name = 'changeRoundness'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeRoundness())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { roundness } = ctx.params
        const { widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is Rectangle =>
                widget.canChangeRoundness() && widget instanceof Rectangle,
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['roundness'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeRoundness(roundness)) changed = true
            }
            return changed
        })
    }
}
