import { ClipboardService } from '../services/ClipboardService'
import { Command, CommandCtx, Shortcut } from './Command'

export class CopyCommand extends Command {
    readonly name = 'copy'
    readonly shortcuts: Shortcut[] = [{ key: 'c', mod: true }]

    canExecute(ctx: CommandCtx): boolean {
        return this.canEdit(ctx)
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        ctx.engine.getService<ClipboardService>('clipboard').copy(ctx.widgets)
    }
}
