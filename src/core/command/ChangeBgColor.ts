import { RGBA } from '../shapes/Color'
import { Shape } from '../shapes/Shape'
import { StickyNote } from '../shapes/stickyNote/StickyNote'
import { TextBox } from '../shapes/text/TextBox'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx } from './Command'

type Params = { color: RGBA }

export class ChangeBgColor extends Command<Params> {
    readonly name = 'changeBgColor'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return this.canEdit(ctx, (widget) => widget.canChangeBgColor())
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { color } = ctx.params
        const targets = ctx.widgets.filter(
            (widget): widget is Shape | TextBox | StickyNote =>
                widget instanceof Shape ||
                widget instanceof TextBox ||
                widget instanceof StickyNote,
        )
        if (!targets.length) return

        const editTable = new Map<Widget, EditingMethods[]>()
        targets.forEach((widget) => {
            editTable.set(widget, ['backgroundColor'])
        })

        this.edit(ctx, editTable, () => {
            let changed = false
            for (const widget of targets) {
                if (widget.changeBgColor(color)) changed = true
            }
            return changed
        })
    }
}
