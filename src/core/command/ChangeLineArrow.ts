import { Line } from '../shapes/line/Line'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeLineArrow extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        return ctx.selectionService.selected.every(
            (widget) => widget instanceof Line,
        )
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return

        const hasHeadArrow = ctx.params?.hasHeadArrow as boolean
        const hasTailArrow = ctx.params?.hasTailArrow as boolean
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        const targets = widgets.filter(
            (widget): widget is Line => widget instanceof Line,
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['arrowPosition'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeArrows(hasHeadArrow, hasTailArrow)) {
                    changed = true
                }
            }
            return changed
        })
    }
}
