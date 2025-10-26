import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Command, CommandCtx, Commands } from './Command'
import { RGBA } from '../shapes/Color'

export class ChangeHighlightColor extends Command {
    private transactionId?: string
    private continuousTimeoutId?: ReturnType<typeof setTimeout>

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeHighlightColor()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (ctx.selectionService.selected.length !== 1) return

        const color = ctx.params?.color as RGBA
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !color) return

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeHighlightColor()) continue

            if (widget instanceof TextBox) {
                if (widget.changeHighlightColor(color)) {
                    affectedWidgets.push(widget)
                }
            } else if (widget instanceof Shape) {
                if (widget.changeHighlightColor(color)) {
                    affectedWidgets.push(widget)
                }
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['highlightColor'])
        })

        if (ctx.isContinuous) {
            // start a new transaction
            if (!this.transactionId) {
                const { transactionId } = ctx.engine.transactionHandler.begin(
                    'continuous',
                    {
                        editTable,
                    },
                )
                this.transactionId = transactionId
            } else {
                // if a transaction already exists, update it
                clearTimeout(this.continuousTimeoutId)
                // TODO: phase 2 - check error
                ctx.engine.transactionHandler.update(this.transactionId)
            }
            const thisCtx = this

            // after some time, commit the changes
            this.continuousTimeoutId = setTimeout(() => {
                if (thisCtx.transactionId) {
                    ctx.engine.transactionHandler.commit(thisCtx.transactionId)
                    thisCtx.transactionId = undefined
                }
            }, CONTINUOUS_THROTTLE_DELAY)
        } else {
            // immediate
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

            // add to db
            // TODO: phase 2 - check error
            ctx.engine.transactionHandler.commit(transactionId)
        }
    }
}
