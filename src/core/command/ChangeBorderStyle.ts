import { BorderStyle } from '@/helpers/Constant'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { Line } from '../shapes/line/Line'
import { Command, CommandCtx, Commands } from './Command'
import { EditingMethods } from '../transaction/State'

export class ChangeBorderStyle extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeBorderStyle()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        if (ctx.selectionService.selected.length !== 1) return

        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []
        const border = ctx.params?.border
            ? (ctx.params.border as BorderStyle)
            : undefined

        if (!widgets?.length || !border) return

        const targets = widgets.filter(
            (widget): widget is Shape | Line =>
                widget.canChangeBorderStyle() &&
                (widget instanceof Shape || widget instanceof Line),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['borderStyle'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeBorderStyle(border)) changed = true
            }
            return changed
        })
    }
}
