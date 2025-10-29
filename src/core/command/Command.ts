import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'

export type Commands =
    | 'delete'
    | 'clone'
    | 'toggleLock'
    | 'changeBgColor'
    | 'changeBorderColor'
    | 'changeBorderStyle'
    | 'changeThickness'
    | 'changeRoundness'
    | 'changeTextColor'
    | 'changeHighlightColor'
    | 'changeTextAlign'

export type CommandCtx = {
    selectionService: SelectionService
    engine: Engine
    isContinuous?: boolean
    params?: Record<string, any>
}

export abstract class Command {
    protected _name: Commands

    constructor(name: Commands) {
        this._name = name
    }

    abstract canExecute(ctx: CommandCtx): boolean
    abstract execute(ctx: CommandCtx): void
}
