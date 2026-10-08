import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { StickyNote } from '../shapes/stickyNote/StickyNote'
import { TextBox } from '../shapes/text/TextBox'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeBgColor extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeBgColor()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const color = ctx.params?.color as RGBA
        const widget = ctx.selectionService.selected[0]
        if (
            !(widget instanceof Shape) &&
            !(widget instanceof TextBox) &&
            !(widget instanceof StickyNote)
        )
            return

        const editTable = new Map<Widget, EditingMethods[]>()
        editTable.set(widget, ['backgroundColor'])

        const edits = ctx.engine.continuousEdits
        if (ctx.isContinuous) {
            edits.apply(this._name, editTable, () =>
                widget.changeBgColor(color),
            )
            return
        }

        // an immediate change closes the running drag on this widget first
        edits.end(this._name, [widget])

        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        if (widget.changeBgColor(color)) {
            ctx.engine.canvas.requestRender()
        }

        // add to db
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId)
    }
}
