import { CloneCommand } from './Clone'
import { Command, Commands } from './Command'
import { DeleteCommand } from './Delete'
import { ToggleLockCommand } from './ToggleLock'
import { ChangeZIndex } from './ChangeZIndex'
import { ChangeBgColor } from './ChangeBgColor'
import { ChangeRoundness } from './ChangeRoundness'
import { ChangeBorderColor } from './ChangeBorderColor'
import { ChangeBorderStyle } from './ChangeBorderStyle'
import { ChangeThickness } from './ChangeThickness'
import { ChangeTextColor } from './ChangeTextColor'
import { ChangeHighlightColor } from './ChangeHighlightColor'
import { ChangeTextAlign } from './ChangeTextAlign'
import { ChangeFontSize } from './ChangeFontSize'
import { ChangeFontStyle } from './ChangeFontStyle'
import { ChangeLineArrow } from './ChangeLineArrow'

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
        this.registerCommand(
            'changeRoundness',
            new ChangeRoundness('changeRoundness'),
        )
        this.registerCommand(
            'changeBorderColor',
            new ChangeBorderColor('changeBorderColor'),
        )
        this.registerCommand(
            'changeBorderStyle',
            new ChangeBorderStyle('changeBorderStyle'),
        )
        this.registerCommand(
            'changeThickness',
            new ChangeThickness('changeThickness'),
        )
        this.registerCommand(
            'changeTextColor',
            new ChangeTextColor('changeTextColor'),
        )
        this.registerCommand(
            'changeHighlightColor',
            new ChangeHighlightColor('changeHighlightColor'),
        )
        this.registerCommand(
            'changeTextAlign',
            new ChangeTextAlign('changeTextAlign'),
        )
        this.registerCommand(
            'changeFontSize',
            new ChangeFontSize('changeFontSize'),
        )
        this.registerCommand(
            'changeFontStyle',
            new ChangeFontStyle('changeFontStyle'),
        )
        this.registerCommand(
            'changeLineArrow',
            new ChangeLineArrow('changeLineArrow'),
        )
    }

    get(name: Commands): Command {
        return this._commands.get(name)!
    }

    registerCommand(name: Commands, cmd: Command) {
        this._commands.set(name, cmd)
    }
}
