import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'
import { FontStyleType } from '@/helpers/Constant'

export class ChangeFontStyle extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeFontStyle()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        const style = ctx.params?.style as FontStyleType
        const value = ctx.params?.value as boolean
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !style) return

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeFontStyle()) continue

            let changed = false

            if (widget instanceof TextBox) {
                changed = widget.changeFontStyle(style, value)
            } else if (widget instanceof Shape) {
                changed = widget.changeFontStyle(style, value)
            }

            if (changed) {
                affectedWidgets.push(widget)
            }
        }

        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['fontStyle'])
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
