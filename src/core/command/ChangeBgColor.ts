import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { StickyNote } from '../shapes/stickyNote/StickyNote'
import { TextBox } from '../shapes/text/TextBox'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

// opacity keeps each widget's own color
type Params = { color: RGBA } | { opacity: number }

export class ChangeBgColor extends Command<Params> {
    readonly name = 'changeBgColor'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeBgColor())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { params } = ctx
        const targets = ctx.widgets.filter(
            (widget): widget is Shape | TextBox | StickyNote =>
                widget.canChangeBgColor() &&
                (widget instanceof Shape ||
                    widget instanceof TextBox ||
                    widget instanceof StickyNote),
        )
        if (!targets.length) return

        const colorOf = (widget: Widget): RGBA | null => {
            if ('color' in params) return params.color
            const current = widget.properties.fillColor as RGBA | undefined
            // transparent ones stay transparent
            if (!current || current.a === 0) return null
            return { ...current, a: params.opacity }
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['backgroundColor'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                const color = colorOf(widget)
                if (color && widget.changeBgColor(color)) changed = true
            }
            return changed
        })
    }
}
