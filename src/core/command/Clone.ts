import { DuplicationService } from '../services/DuplicationService'
import { Command, CommandCtx, Commands } from './Command'

export class CloneCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) {
            return false
        }
        if (ctx.selectionService.isThereLockedWidget()) {
            return false
        }

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        const duplicationService =
            ctx.engine.getService<DuplicationService>('duplication')
        const addedWidgets = duplicationService.duplicateWidgets(
            ctx.selectionService.selected,
        )

        ctx.selectionService.selectWidgets(addedWidgets)
        ctx.engine.canvas.requestRender()
    }
}
