import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

export type AlignTo =
    | 'left'
    | 'centerX'
    | 'right'
    | 'top'
    | 'centerY'
    | 'bottom'

type Params = { to: AlignTo }

export class AlignCommand extends Command<Params> {
    readonly name = 'align'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return (
            this.canEdit(ctx) &&
            ctx.widgets.filter((w) => w.canAlign()).length > 1
        )
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { to } = ctx.params
        const targets = ctx.widgets.filter((w) => w.canAlign())
        const box = BoundingBox.createWithMerge(...targets.map((w) => w.bounds))

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => editTable.set(widget, ['move']))

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                const { dx, dy } = delta(widget.bounds, box, to)
                // float noise from an earlier align
                if (Math.hypot(dx, dy) < 1e-6) continue

                widget.move(widget.left + dx, widget.top + dy)
                changed = true
            }
            return changed
        })
    }
}

function delta(bounds: BoundingBox, box: BoundingBox, to: AlignTo) {
    switch (to) {
        case 'left':
            return { dx: box.left - bounds.left, dy: 0 }
        case 'centerX':
            return { dx: box.centerX - bounds.centerX, dy: 0 }
        case 'right':
            return { dx: box.right - bounds.right, dy: 0 }
        case 'top':
            return { dx: 0, dy: box.top - bounds.top }
        case 'centerY':
            return { dx: 0, dy: box.centerY - bounds.centerY }
        case 'bottom':
            return { dx: 0, dy: box.bottom - bounds.bottom }
    }
}
