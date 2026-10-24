import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Path } from '../shapes/path/Path'
import { Line } from '@/core/shapes/line/Line'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

// opacity keeps each widget's own color
type Params = { color: RGBA } | { opacity: number }

const strokeColorOf = (widget: Shape | Path | Line) => {
    if (widget instanceof Line) return widget.strokeColor
    const key = widget instanceof Path ? 'color' : 'strokeColor'
    return widget.properties[key] as RGBA | undefined
}

export class ChangeBorderColor extends Command<Params> {
    readonly name = 'changeBorderColor'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeBorderColor())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { params, widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is Shape | Path | Line =>
                widget.canChangeBorderColor() &&
                (widget instanceof Shape ||
                    widget instanceof Path ||
                    widget instanceof Line),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['borderColor'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                const current = strokeColorOf(widget)
                const color =
                    'color' in params
                        ? params.color
                        : current && { ...current, a: params.opacity }
                if (color && widget.changeBorderColor(color)) changed = true
            }
            return changed
        })
    }
}
