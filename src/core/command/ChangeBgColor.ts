import { RGBA } from '../shapes/Color'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeBgColor extends Command {
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

        const color = ctx.params?.color as RGBA
        const widget = ctx.selectionService.selected[0]
        if (widget.changeBgColor(color)) {
            ctx.engine.canvas.requestRender()
        }

        // TODO: add to DB
        // TODO: continuous actions?
    }
}
