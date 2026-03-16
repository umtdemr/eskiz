import { WidgetsService } from '../services/WidgetsService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class DeleteCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (
            !ctx.params ||
            !(ctx.params?.widgets as Widget[] | undefined)?.length
        ) {
            return false
        }

        // if there is any locked widget
        if (
            (ctx.params.widgets as Widget[]).some((widget) => widget.isLocked)
        ) {
            return false
        }

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        const widgetService = ctx.engine.getService<WidgetsService>('widgets')
        const editTable = new Map<Widget, EditingMethods[]>()

        const widgets = [...((ctx.params?.widgets as Widget[]) || [])]
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
