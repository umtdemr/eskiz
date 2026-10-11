import { Line } from '../shapes/line/Line'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { hasHeadArrow: boolean; hasTailArrow: boolean }

export class ChangeLineArrow extends Command<Params> {
    readonly name = 'changeLineArrow'

    canExecute(ctx: CommandCtx<Params>): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        return ctx.selectionService.selected.every(
            (widget) => widget instanceof Line,
        )
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { hasHeadArrow, hasTailArrow } = ctx.params
        const { widgets } = ctx

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
