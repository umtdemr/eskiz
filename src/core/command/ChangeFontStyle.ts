import { TextBox } from '../shapes/text/TextBox'
import { Shape } from '../shapes/Shape'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { Command, CommandCtx, Commands } from './Command'
import { FontStyleType } from '@/helpers/Constant'
import { StickyNote } from '../shapes/stickyNote/StickyNote'

export class ChangeFontStyle extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) return false
        if (ctx.selectionService.isThereLockedWidget()) return false
        if (!ctx.selectionService.canAllChangeFontStyle()) return false

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) return
        const style = ctx.params?.style as FontStyleType
        const value = ctx.params?.value as boolean
        const widgets = ctx.params?.widgets
            ? (ctx.params.widgets as Widget[])
            : []

        if (!widgets?.length || !style) return

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

        const { transactionId } = ctx.engine.transactionHandler.begin(
            'immediate',
            {
                editTable,
            },
        )

        let changed = false
        for (const widget of targets) {
            if (widget.changeFontStyle(style, value)) changed = true
        }
        if (changed) {
            ctx.engine.canvas.requestRender()
        }

        // add to db
        // TODO: phase 2 - check error
        ctx.engine.transactionHandler.commit(transactionId, changed)
    }
}
