import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Path } from '../shapes/path/Path'
import { Line } from '@/core/shapes/line/Line'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'

export class ChangeBorderColor extends Command {
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
                if (widget.changeBorderColor(color)) changed = true
            }
            return changed
        })
    }
}
