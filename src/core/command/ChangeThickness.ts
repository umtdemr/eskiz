import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Path } from '../shapes/path/Path'
import { Line } from '../shapes/line/Line'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { thickness: number }

export class ChangeThickness extends Command<Params> {
    readonly name = 'changeThickness'

    canExecute(ctx: CommandCtx<Params>): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeThickness()) return false

        return true
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const { thickness } = ctx.params
        const { widgets } = ctx
        if (!thickness) return

        const targets = widgets.filter(
            (widget): widget is Shape | Path | Line =>
                widget.canChangeThickness() &&
                (widget instanceof Shape ||
                    widget instanceof Path ||
                    widget instanceof Line),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            // pens change their bounds with the width
            if (widget instanceof Path) {
                editTable.set(widget, ['resize', 'thickness'])
            } else {
                editTable.set(widget, ['thickness'])
            }
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeThickness(thickness)) changed = true
            }
            return changed
        })
    }
}
