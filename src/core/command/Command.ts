import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import type { RGBA } from '../shapes/Color'
import type { TEXT_ALIGN } from '../shapes/text/TextBox'
import type { BorderStyle, FontStyleType } from '@/helpers/Constant'
import type { ZIndexAction } from './ChangeZIndex'

type NoParams = Record<string, never>

// what each command takes besides the widgets
export type CommandParams = {
    delete: NoParams
    clone: NoParams
    toggleLock: NoParams
    changeBgColor: { color: RGBA }
    changeBorderColor: { color: RGBA }
    changeBorderStyle: { border: BorderStyle }
    changeThickness: { thickness: number }
    changeRoundness: { roundness: number }
    changeTextColor: { rgba: string }
    changeHighlightColor: { rgba: string }
    changeTextAlign: { textAlign: TEXT_ALIGN }
    changeFontSize: { fontSize: number }
    changeFontStyle: { style: FontStyleType; value: boolean }
    changeZIndex: { action: ZIndexAction }
    changeLineArrow: { hasHeadArrow: boolean; hasTailArrow: boolean }
}

export type Commands = keyof CommandParams

export type ExecuteOptions = {
    continuous?: boolean
    // defaults to the selection
    widgets?: Widget[]
}

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

        // begin commits the running drag on these widgets first
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
