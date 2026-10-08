import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'
import { TEXT_ALIGN } from '../shapes/text/TextBox'

export class ChangeTextAlign extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeTextAlign()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const textAlign = ctx.params?.textAlign as TEXT_ALIGN
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !textAlign) return

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
