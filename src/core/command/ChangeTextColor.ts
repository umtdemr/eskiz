import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { rgba: string }

export class ChangeTextColor extends Command<Params> {
    readonly name = 'changeTextColor'

    canExecute(ctx: CommandCtx<Params>): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeTextColor()) return false

        return true
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const { rgba: color } = ctx.params
        const { widgets } = ctx
        if (!color) return

        const targets = widgets.filter(
            (widget): widget is TextBox | Shape =>
                widget.canChangeTextColor() &&
                (widget instanceof TextBox || widget instanceof Shape),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['textColor'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeTextColor(color)) changed = true
            }
            return changed
        })
    }
}
