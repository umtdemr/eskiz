import { WidgetsService } from '../services/WidgetsService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ToggleLockCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) {
            return false
        }

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        if (ctx.selectionService.selected.length !== 1) {
            return
        }

        const widgetService = ctx.engine.getService<WidgetsService>('widgets')
        const editTable = new Map<Widget, EditingMethods[]>()

        ctx.selectionService.selected.forEach((widget) => {
            widgetService.toggleLockState(widget)
            editTable.set(widget, ['toggleLock'])
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
        ctx.engine.canvas.requestRender()
    }
}
