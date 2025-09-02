import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class DeleteCommand extends Command {
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

        const editTable = new Map<Widget, EditingMethods[]>()

        ctx.selectionService.selected.forEach((widget) => {
            widget.isDeleted = true
            editTable.set(widget, ['delete'])
        })
        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        ctx.engine.transactionHandler.commit(transactionId)
        ctx.engine.canvas.requestRender()
    }
}
