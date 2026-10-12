import { Command, CommandCtx, Shortcut } from './Command'

export class UndoCommand extends Command {
    readonly name = 'undo'
    readonly shortcuts: Shortcut[] = [{ key: 'z', mod: true }]

    canExecute(ctx: CommandCtx): boolean {
        const { historyManager, continuousEdits } = ctx.engine
        // an open edit is pushed to the history right before undoing
        return historyManager.canUndo || continuousEdits.hasOpen
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        ctx.engine.historyManager.undo()
    }
}
