import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'

export type Commands = 'delete'

export type CommandCtx = {
    selectionService: SelectionService
    engine: Engine
}

export abstract class Command {
    protected _name: Commands

    constructor(name: Commands) {
        this._name = name
    }

    abstract canExecute(ctx: CommandCtx): boolean
    abstract execute(ctx: CommandCtx): void
}
