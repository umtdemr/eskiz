import { Command, CommandCtx, Shortcut } from './Command'

export class ClearSelectionCommand extends Command {
    readonly name = 'clearSelection'
    readonly shortcuts: Shortcut[] = [{ key: 'Escape' }]

    canExecute(ctx: CommandCtx): boolean {
        return ctx.selectionService.selected.length > 0
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        ctx.selectionService.clearSelection()
        ctx.engine.canvas.requestRender()
    }
}
