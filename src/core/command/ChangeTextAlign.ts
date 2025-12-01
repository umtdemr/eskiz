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

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeTextAlign()) continue

            if (widget instanceof TextBox) {
                if (widget.changeTextAlign(textAlign)) {
                    affectedWidgets.push(widget)
                }
            } else if (widget instanceof Shape) {
                if (widget.changeTextAlign(textAlign)) {
                    affectedWidgets.push(widget)
                }
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['textAlign'])
        })

        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        // add to db
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId)
    }
}
