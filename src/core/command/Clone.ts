import { DuplicationService } from '../services/DuplicationService'
import { Widget } from '../shapes/Widget'
import { Command, CommandCtx, Commands } from './Command'

export class CloneCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.params?.widgets?.length) {
            return false
        }

        if (ctx.params?.widgets?.some((widget: Widget) => widget?.isLocked)) {
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
            ctx.params!.widgets,
        )

        ctx.selectionService.selectWidgets(addedWidgets)
        ctx.engine.canvas.requestRender()
    }
}
