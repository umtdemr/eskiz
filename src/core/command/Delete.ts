import { WidgetsService } from '../services/WidgetsService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

export class DeleteCommand extends Command {
    readonly name = 'delete'

    canExecute(ctx: CommandCtx): boolean {
        return this.canEdit(ctx)
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        const widgetService = ctx.engine.getService<WidgetsService>('widgets')
        const editTable = new Map<Widget, EditingMethods[]>()

        const widgets = [...ctx.widgets]
        widgets.forEach((widget) => {
            editTable.set(widget, ['delete'])
        })
        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        widgets.forEach((widget) => {
            widgetService.deleteWidget(widget)
        })

        ctx.engine.transactionHandler.commit(transactionId)
        ctx.engine.canvas.requestRender()
    }
}
