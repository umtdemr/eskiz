import { CloneCommand } from './Clone'
import { Command, Commands } from './Command'
import { DeleteCommand } from './Delete'
import { ToggleLockCommand } from './ToggleLock'
import { ChangeZIndex } from './ChangeZIndex'
import { ChangeBgColor } from './ChangeBgColor'

export class CommandRegistry {
    private _commands = new Map<Commands, Command>()
    constructor() {
        this.registerAllCommands()
    }

    registerAllCommands() {
        this.registerCommand('delete', new DeleteCommand('delete'))
        this.registerCommand('clone', new CloneCommand('clone'))
        this.registerCommand('toggleLock', new ToggleLockCommand('toggleLock'))
        this.registerCommand('changeZIndex', new ChangeZIndex('changeZIndex'))
        this.registerCommand(
            'changeBgColor',
            new ChangeBgColor('changeBgColor'),
        )
    }

    get(name: Commands): Command {
        return this._commands.get(name)!
    }

    registerCommand(name: Commands, cmd: Command) {
        this._commands.set(name, cmd)
    }
}
