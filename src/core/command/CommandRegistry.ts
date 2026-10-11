import { CloneCommand } from './Clone'
import { Command, CommandCtx, ExecuteOptions } from './Command'
import type { Engine } from '../engine/Engine'
import type { SelectionService } from '../services/SelectionService'
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

const createCommands = () => [
    new DeleteCommand(),
    new CloneCommand(),
    new ToggleLockCommand(),
    new ChangeZIndex(),
    new ChangeBgColor(),
    new ChangeRoundness(),
    new ChangeBorderColor(),
    new ChangeBorderStyle(),
    new ChangeThickness(),
    new ChangeTextColor(),
    new ChangeHighlightColor(),
    new ChangeTextAlign(),
    new ChangeFontSize(),
    new ChangeFontStyle(),
    new ChangeLineArrow(),
]

type Registered = ReturnType<typeof createCommands>[number]

// command name -> its params, read from the commands above
export type CommandParams = {
    [C in Registered as C['name']]: C extends Command<infer P> ? P : never
}

export type Commands = keyof CommandParams

export class CommandRegistry {
    private _commands = new Map<string, Registered>()
    constructor() {
        createCommands().forEach((cmd) => this.registerCommand(cmd))
    }

    get<K extends Commands>(name: K) {
        return this._commands.get(name) as Command<CommandParams[K]>
    }

    // returns false when the command can't run on the targets
    execute<K extends Commands>(
        engine: Engine,
        name: K,
        params: CommandParams[K],
        { continuous = false, widgets }: ExecuteOptions = {},
    ): boolean {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const ctx: CommandCtx<CommandParams[K]> = {
            selectionService,
            engine,
            widgets: widgets ?? selectionService.selected,
            isContinuous: continuous,
            params,
        }

        const command = this.get(name)
        if (!command.canExecute(ctx)) return false

        command.execute(ctx)
        return true
    }

    registerCommand(cmd: Registered) {
        this._commands.set(cmd.name, cmd)
    }
}
