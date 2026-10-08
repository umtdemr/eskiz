import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeTextColor extends Command {
    private transactionId?: string
    private continuousTimeoutId?: ReturnType<typeof setTimeout>

    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeTextColor()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const color = ctx.params?.rgba as string
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !color) return

        const targets = widgets.filter(
            (widget): widget is TextBox | Shape =>
                widget.canChangeTextColor() &&
                (widget instanceof TextBox || widget instanceof Shape),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['textColor'])
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

            if (this.apply(targets, color)) {
                ctx.engine.canvas.requestRender()
            }

            // if a transaction already exists, update it
            clearTimeout(this.continuousTimeoutId)
            // TODO: phase 2 - check error
            ctx.engine.transactionHandler.update(this.transactionId)

            // after some time, commit the changes
            this.continuousTimeoutId = setTimeout(() => {
                if (this.transactionId) {
                    ctx.engine.transactionHandler.commit(this.transactionId)
                    this.transactionId = undefined
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

            const changed = this.apply(targets, color)
            if (changed) {
                ctx.engine.canvas.requestRender()
            }

            // add to db
            // TODO: phase 2 - check error
            ctx.engine.transactionHandler.commit(transactionId, changed)
        }
    }

    private apply(widgets: (TextBox | Shape)[], color: string) {
        let changed = false
        for (const widget of widgets) {
            if (widget.changeTextColor(color)) changed = true
        }
        return changed
    }
}
