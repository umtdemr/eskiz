import { WidgetsService } from '../services/WidgetsService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

export class ToggleLockCommand extends Command {
    readonly name = 'toggleLock'

    canExecute(ctx: CommandCtx): boolean {
        return ctx.widgets.length > 0
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        const widgetService = ctx.engine.getService<WidgetsService>('widgets')
        const editTable = new Map<Widget, EditingMethods[]>()

        ctx.widgets.forEach((widget) => {
            editTable.set(widget, ['toggleLock'])
        })
        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        ctx.widgets.forEach((widget) => {
            widgetService.toggleLockState(widget)
        })

        // add to db
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId)

        if (ctx.widgets.length > 1) {
            ctx.selectionService.clearSelection()
        }
        ctx.engine.canvas.requestRender()
    }
}
