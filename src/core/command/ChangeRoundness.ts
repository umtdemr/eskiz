import { Rectangle } from '../shapes/Rectangle'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeRoundness extends Command {
    private transactionId?: string
    private continuousTimeoutId?: ReturnType<typeof setTimeout>

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeRoundness()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (ctx.selectionService.selected.length !== 1) return

        const roundness = ctx.params?.roundness as number
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || roundness === undefined) return

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeRoundness() || !(widget instanceof Rectangle))
                continue

            if (widget.changeRoundness(roundness)) {
                affectedWidgets.push(widget)
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['roundness'])
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
