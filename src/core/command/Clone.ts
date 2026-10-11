import { DuplicationService } from '../services/DuplicationService'
import { Command, CommandCtx } from './Command'

export class CloneCommand extends Command {
    readonly name = 'clone'

    canExecute(ctx: CommandCtx): boolean {
        return this.canEdit(ctx)
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        const duplicationService =
            ctx.engine.getService<DuplicationService>('duplication')
        const addedWidgets = duplicationService.duplicateWidgets(ctx.widgets)

        ctx.selectionService.selectWidgets(addedWidgets)
        ctx.engine.canvas.requestRender()
    }
}
