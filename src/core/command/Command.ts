export type Commands = 'delete'

export abstract class Command {
    protected _name: Commands

    constructor(name: Commands) {
        this._name = name
    }

    abstract canExecute(): boolean
    abstract execute(): void
}
