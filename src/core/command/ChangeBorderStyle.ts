import { BorderStyle } from '@/helpers/Constant'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Command, CommandCtx, Commands } from './Command'
import { EditingMethods } from '../transaction/State'

export class ChangeBorderStyle extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeBgColor()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (ctx.selectionService.selected.length !== 1) return

        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []
        const border = ctx.params?.border
            ? (ctx.params.border as BorderStyle)
            : undefined

        if (!widgets?.length || !border) return

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeBorderStyle() || !(widget instanceof Shape))
                continue

            if (widget.changeBorderStyle(border)) {
                affectedWidgets.push(widget)
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['borderStyle'])
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
