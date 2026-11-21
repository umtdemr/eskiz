import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { axis: 'x' | 'y' }

// equal gaps between the widgets, the outer edges stay where they are
export class DistributeCommand extends Command<Params> {
    readonly name = 'distribute'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return (
            this.canEdit(ctx) &&
            ctx.widgets.filter((w) => w.canAlign()).length > 2
        )
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const isHorizontal = ctx.params.axis === 'x'
        const start = (b: BoundingBox) => (isHorizontal ? b.left : b.top)
        const size = (b: BoundingBox) => (isHorizontal ? b.width : b.height)
        const center = (b: BoundingBox) =>
            isHorizontal ? b.centerX : b.centerY

        const targets = ctx.widgets
            .filter((w) => w.canAlign())
            .sort((a, b) => center(a.bounds) - center(b.bounds))
        const box = BoundingBox.createWithMerge(...targets.map((w) => w.bounds))
        const steps = targets.length - 1
        const used = targets.reduce((sum, w) => sum + size(w.bounds), 0) // total size of widgets in the axis
        const gap = (size(box) - used) / steps // calculate gap
        const first = center(targets[0].bounds)
        const step = (center(targets[steps].bounds) - first) / steps

        // where each one should start
        let pos = start(box)
        const starts = targets.map((widget, i) => {
            // they don't fit one after another, space the centers instead
            if (gap < 0) return first + step * i - size(widget.bounds) / 2

            const at = pos
            pos += size(widget.bounds) + gap
            return at
        })

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => editTable.set(widget, ['move']))

        this.edit(ctx, editTable, () => {
            let changed = false
            targets.forEach((widget, i) => {
                const d = starts[i] - start(widget.bounds)
                // float noise from an earlier distribute
                if (Math.abs(d) < 1e-6) return

                widget.move(
                    widget.left + (isHorizontal ? d : 0),
                    widget.top + (isHorizontal ? 0 : d),
                )
                changed = true
            })
            return changed
        })
    }
}
