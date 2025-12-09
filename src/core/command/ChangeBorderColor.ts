import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Path } from '../shapes/path/Path'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeBorderColor extends Command {
    private transactionId?: string
    private continuousTimeoutId?: ReturnType<typeof setTimeout>

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeBorderColor()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const color = ctx.params?.color as RGBA
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !color) return

        const affectedWidgets = []
        for (const widget of widgets) {
            if (!widget.canChangeBorderColor()) continue

            let changed = false
            if (widget instanceof Shape || widget instanceof Path) {
                changed = widget.changeBorderColor(color)
            }

            if (changed) {
                affectedWidgets.push(widget)
            }
        }
        if (affectedWidgets.length) {
            ctx.engine.canvas.requestRender()
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        affectedWidgets.forEach((widget) => {
            editTable.set(widget, ['borderColor'])
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
