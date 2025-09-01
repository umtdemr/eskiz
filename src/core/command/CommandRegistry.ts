import { Command, Commands } from './Command'

export class CommandRegistry {
    private _commands = new Map<Commands, Command>()
    constructor() {
        this.registerAllCommands()
    }

    registerAllCommands() {}

    get(name: Commands): Command {
        return this._commands.get(name)!
    }

    registerCommand(name: Commands, cmd: Command) {
        this._commands.set(name, cmd)
    }
}
