import { Service } from '@/core/services/Service.ts'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'

export class PageService extends Service {
    async fetchPageDetails(page_id: number) {
        return await this.engine.wsEngine.sendAsyncMessage<'fetchPageDetails'>({
            type: 'fetchPageDetails',
            data: {
                page_id,
            },
        })
    }

    /**
     * Adds given widgets to the canvas. Can be used for loading widgets, initially.
     * @param widgets - Widgets to add.
     */
    addWidgetsToCanvas(widgets: WsWidget[]) {
        const widgetLayer = this.engine.stage.widgetsDefaultLayer
        for (const widget of widgets) {
            const widgetClass = WidgetFactory.loadFromJson(widget)
            if (!widgetClass) {
                continue
            }

            widgetLayer.addChildren(widgetClass)
        }
    }
}
