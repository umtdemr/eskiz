import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { fontSize: number }

export class ChangeFontSize extends Command<Params> {
    readonly name = 'changeFontSize'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeFontSize())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { fontSize } = ctx.params
        const { widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is TextBox | Shape =>
                widget.canChangeFontSize() &&
                (widget instanceof TextBox || widget instanceof Shape),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['fontSize'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeFontSize(fontSize)) changed = true
            }
            return changed
        })
    }
}
