import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'
import { FontStyleType } from '@/helpers/Constant'
import { StickyNote } from '../shapes/stickyNote/StickyNote'

type Params = { style: FontStyleType; value: boolean }

export class ChangeFontStyle extends Command<Params> {
    readonly name = 'changeFontStyle'

    canExecute(ctx: CommandCtx<Params>): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeFontStyle()) return false

        return true
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return
        const { style, value } = ctx.params
        const { widgets } = ctx

        const targets = widgets.filter(
            (widget): widget is TextBox | Shape | StickyNote =>
                widget.canChangeFontStyle() &&
                (widget instanceof TextBox ||
                    widget instanceof Shape ||
                    widget instanceof StickyNote),
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['fontStyle'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeFontStyle(style, value)) changed = true
            }
            return changed
        })
    }
}
