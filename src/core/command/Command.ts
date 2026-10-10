import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'

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
    | 'changeFontSize'
    | 'changeFontStyle'
    | 'changeZIndex'
    | 'changeLineArrow'

export type CommandCtx = {
    selectionService: SelectionService
    engine: Engine
    isContinuous?: boolean
    params?: Record<string, unknown>
}

export abstract class Command {
    protected _name: Commands

    constructor(name: Commands) {
        this._name = name
    }

    abstract canExecute(ctx: CommandCtx): boolean
    abstract execute(ctx: CommandCtx): void

    // runs `change` inside a transaction. continuous calls join the open edit
    // on the same widgets, immediate ones get their own transaction
    protected edit(
        ctx: CommandCtx,
        editTable: Map<Widget, EditingMethods[]>,
        change: () => boolean,
    ) {
        const edits = ctx.engine.continuousEdits
        if (ctx.isContinuous) {
            edits.apply(this._name, editTable, change)
            return
        }

        // an immediate change closes the running drag on these widgets first
        edits.end(this._name, [...editTable.keys()])

        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        const changed = change()
        if (changed) {
            ctx.engine.canvas.requestRender()
        }

        // add to db, unchanged values stay out of the history
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId, changed)
    }
}
