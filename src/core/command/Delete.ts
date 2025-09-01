import { Command, CommandCtx, Commands } from './Command'

export class DeleteCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }
    }
}
