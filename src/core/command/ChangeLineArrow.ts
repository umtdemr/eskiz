import { Line } from '../shapes/line/Line'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeLineArrow extends Command {
    private transactionId?: string

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        return ctx.selectionService.selected.every(
            (widget) => widget instanceof Line,
        )
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        const hasHeadArrow = ctx.params?.hasHeadArrow as boolean
        const hasTailArrow = ctx.params?.hasTailArrow as boolean
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        widgets.forEach((widget) => {
            if (widget instanceof Line) {
                editTable.set(widget, ['arrowPosition'])
            }
        })

        if (this.transactionId) {
            ctx.engine.transactionHandler.commit(this.transactionId)
            this.transactionId = undefined
        }

        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        const affectedWidgets = []
        for (const widget of widgets) {
            if (widget instanceof Line) {
                const changed = widget.changeArrows(hasHeadArrow, hasTailArrow)

                if (changed) {
                    affectedWidgets.push(widget)
                }
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        // add to db
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId)
    }
}
