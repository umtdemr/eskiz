import { ACTION_MODES } from '@/helpers/Constant'
import { ToolService } from '../services/ToolService'
import { Widget } from '../shapes/Widget'
import { Command, CommandCtx, Shortcut } from './Command'

export class SelectAllCommand extends Command {
    readonly name = 'selectAll'
    readonly shortcuts: Shortcut[] = [{ key: 'a', mod: true }]

    canExecute(ctx: CommandCtx): boolean {
        return this.selectable(ctx).length > 0
    }

    execute(ctx: CommandCtx) {
        const widgets = this.selectable(ctx)
        if (!widgets.length) return

        // other tools drop the selection
        const toolService = ctx.engine.getService<ToolService>('toolService')
        if (toolService.tool !== ACTION_MODES.SELECT) {
            toolService.changeTool(ACTION_MODES.SELECT)
        }

        ctx.selectionService.selectWidgets(widgets)
    }

    // same rules as the selection rectangle, locked ones stay out
    private selectable(ctx: CommandCtx) {
        const widgets: Widget[] = []
        for (const child of ctx.engine.stage.widgetsDefaultLayer.children) {
            if (!(child instanceof Widget) || !child.interactive) continue
            if (!child.visible || child.isDeleted || child.isLocked) continue
            widgets.push(child)
        }
        return widgets
    }
}
