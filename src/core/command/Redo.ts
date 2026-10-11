import { Command, CommandCtx, Shortcut } from './Command'

export class RedoCommand extends Command {
    readonly name = 'redo'
    readonly shortcuts: Shortcut[] = [
        { key: 'z', mod: true, shift: true },
        { key: 'y', mod: true },
    ]

    canExecute(ctx: CommandCtx): boolean {
        return ctx.engine.historyManager.canRedo
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        ctx.engine.historyManager.redo()
    }
}
