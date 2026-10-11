import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import type { Commands } from './CommandRegistry'

export type NoParams = Record<string, never>

export type ExecuteOptions = {
    continuous?: boolean
    // defaults to the selection
    widgets?: Widget[]
}

export type CommandCtx<P = NoParams> = {
    selectionService: SelectionService
    engine: Engine
    widgets: Widget[]
    isContinuous?: boolean
    params: P
}

// P is what the command takes besides the widgets
export abstract class Command<P = NoParams> {
    abstract readonly name: Commands

    abstract canExecute(ctx: CommandCtx<P>): boolean
    abstract execute(ctx: CommandCtx<P>): void

    // there are targets, none is locked and all pass `check`
    protected canEdit(
        ctx: CommandCtx<P>,
        check: (widget: Widget) => boolean = () => true,
    ) {
        const { widgets } = ctx
        if (!widgets.length) return false
        if (widgets.some((widget) => widget.isLocked)) return false

        return widgets.every(check)
    }

    // runs `change` inside a transaction. continuous calls join the open edit
    // on the same widgets, immediate ones get their own transaction
    protected edit(
        ctx: CommandCtx<P>,
        editTable: Map<Widget, EditingMethods[]>,
        change: () => boolean,
    ) {
        const edits = ctx.engine.continuousEdits
        if (ctx.isContinuous) {
            edits.apply(this.name, editTable, change)
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
