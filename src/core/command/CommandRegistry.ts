import { CloneCommand } from './Clone'
import {
    Command,
    CommandCtx,
    ExecuteOptions,
    KeyInput,
    matchesShortcut,
} from './Command'
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
import { UndoCommand } from './Undo'
import { RedoCommand } from './Redo'
import { SelectAllCommand } from './SelectAll'
import { ClearSelectionCommand } from './ClearSelection'
import { MoveCommand } from './Move'
import { ChangeTool } from './ChangeTool'
import { PasteCommand } from './Paste'
import { CopyCommand } from './Copy'
import { Signal } from '../signal/Signal'

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
    new UndoCommand(),
    new RedoCommand(),
    new SelectAllCommand(),
    new ClearSelectionCommand(),
    new MoveCommand(),
    new ChangeTool(),
    new PasteCommand(),
    new CopyCommand(),
]

type Registered = ReturnType<typeof createCommands>[number]

// command name -> its params, read from the commands above
export type CommandParams = {
    [C in Registered as C['name']]: C extends Command<infer P> ? P : never
}

export type Commands = keyof CommandParams

export class CommandRegistry {
    private _commands = new Map<string, Registered>()

    // name of every command that ran
    executed = new Signal<Commands>()

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
        options?: ExecuteOptions,
    ): boolean {
        return this.run(engine, this.get(name), params, options)
    }

    // runs the first command bound to the keys that can run. returns true
    // when a command is bound to them, even if none of them could run
    executeShortcut(engine: Engine, input: KeyInput): boolean {
        let bound = false
        for (const { name } of this._commands.values()) {
            const command = this.get(name)
            for (const shortcut of command.shortcuts) {
                if (!matchesShortcut(shortcut, input)) continue
                bound = true

                // commands without params leave them out
                const params = shortcut.params ?? {}
                const options = { continuous: shortcut.continuous }
                if (this.run(engine, command, params, options)) return true
            }
        }
        return bound
    }

    private run<P>(
        engine: Engine,
        command: Command<P>,
        params: P,
        { continuous = false, widgets }: ExecuteOptions = {},
    ): boolean {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const ctx: CommandCtx<P> = {
            selectionService,
            engine,
            widgets: widgets ?? [...selectionService.selected],
            isContinuous: continuous,
            params,
        }

        if (!command.canExecute(ctx)) return false

        command.execute(ctx)
        this.executed.dispatch(command.name)
        return true
    }

    registerCommand(cmd: Registered) {
        this._commands.set(cmd.name, cmd)
    }
}
