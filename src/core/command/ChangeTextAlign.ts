import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'
import { TEXT_ALIGN } from '../shapes/text/TextBox'

type Params = { textAlign: TEXT_ALIGN }

export class ChangeTextAlign extends Command<Params> {
    readonly name = 'changeTextAlign'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeTextAlign())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { textAlign } = ctx.params
        const { widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is TextBox | Shape =>
                widget.canChangeTextAlign() &&
                (widget instanceof TextBox || widget instanceof Shape),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['textAlign'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeTextAlign(textAlign)) changed = true
            }
            return changed
        })
    }
}
