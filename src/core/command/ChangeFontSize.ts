import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeFontSize extends Command {
    private transactionId?: string
    private continuousTimeoutId?: ReturnType<typeof setTimeout>

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeFontSize()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const fontSize = ctx.params?.fontSize as number
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || fontSize === undefined) return

        const editTable = new Map<Widget, EditingMethods[]>()
        widgets.forEach((widget) => {
            if (!widget.canChangeFontSize()) return
            editTable.set(widget, ['fontSize'])
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
            }

            const affectedWidgets = []
            for (const widget of widgets) {
                if (!widget.canChangeFontSize()) continue

                if (widget instanceof TextBox) {
                    if (widget.changeFontSize(fontSize)) {
                        affectedWidgets.push(widget)
                    }
                } else if (widget instanceof Shape) {
                    if (widget.changeFontSize(fontSize)) {
                        affectedWidgets.push(widget)
                    }
                }
            }
            if (affectedWidgets.length) {
                ctx.engine.canvas.requestRender()
            }

            // if a transaction already exists, update it
            clearTimeout(this.continuousTimeoutId)
            // TODO: phase 2 - check error
            ctx.engine.transactionHandler.update(this.transactionId)

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

            const affectedWidgets = []
            for (const widget of widgets) {
                if (!widget.canChangeFontSize()) continue

                if (widget instanceof TextBox) {
                    if (widget.changeFontSize(fontSize)) {
                        affectedWidgets.push(widget)
                    }
                } else if (widget instanceof Shape) {
                    if (widget.changeFontSize(fontSize)) {
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
}
