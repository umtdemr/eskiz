import { nanoid } from 'nanoid'
import { PageService } from '../services/PageService'
import { Command, CommandCtx, Commands } from './Command'
import { WidgetsService } from '../services/WidgetsService'
import { CreationHistoryEntry } from '@/core/history/HistoryManager'

export class CloneCommand extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        if (!ctx.selectionService.selected?.length) {
            return false
        }
        if (ctx.selectionService.isThereLockedWidget()) {
            return false
        }

        return true
    }

    execute(ctx: CommandCtx) {
        if (!this.canExecute(ctx)) {
            return
        }

        if (ctx.selectionService.selected.length !== 1) {
            return
        }

        const pageService = ctx.engine.getService<PageService>('page')
        const widgetsService = ctx.engine.getService<WidgetsService>('widgets')
        const widget = ctx.selectionService.selected[0]
        const widgetJson = widget.toJson()

        widgetJson.x = widgetJson.x + 20
        widgetJson.y = widgetJson.y + 20
        widgetJson.z_index = ctx.engine.stage.indexer.generateIndexForWidget(
            ctx.engine.stage.widgetsDefaultLayer,
            null,
        )
        widgetJson.uuid = nanoid()

        const addedWidgets = pageService.addWidgetsToCanvas([widgetJson])

        ctx.selectionService.selectWidgets(addedWidgets)
        ctx.engine.canvas.requestRender()

        // add to db
        // TODO: phase 2 - check error
        widgetsService.addWidget({ ...widgetJson, page_id: ctx.engine.pageId })
        ctx.engine.historyManager.push(
            new CreationHistoryEntry(ctx.engine, addedWidgets),
        )
    }
}
