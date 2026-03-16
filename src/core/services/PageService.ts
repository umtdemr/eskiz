import { Service } from '@/core/services/Service.ts'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'
import { Widget } from '../shapes/Widget'
import { Line } from '@/core/shapes/line/Line'

export class PageService extends Service {
    async fetchPageDetails(page_id: number) {
        return await this.engine.syncAdapter.fetchPageDetails(page_id)
    }

    /**
     * Adds given widgets to the canvas. Can be used for loading widgets, initially.
     * @param widgets - Widgets to add.
     */
    addWidgetsToCanvas(widgets: WsWidget[]): Widget[] {
        const addedWidgets = []
        const widgetLayer = this.engine.stage.widgetsDefaultLayer
        for (const widget of widgets) {
            if (widget.is_deleted) continue
            const widgetClass = WidgetFactory.loadFromJson(widget, this.engine)
            if (!widgetClass) {
                continue
            }

            addedWidgets.push(widgetClass)
            widgetLayer.addChildren(widgetClass)
        }

        // resolve bindings for all lines after all widgets are added
        for (const widget of addedWidgets) {
            if (!(widget instanceof Line)) {
                continue
            }
            widget.resolveBindings(widgetLayer)

            // update line points if binding is set
            // because when we move the widget, the line points are not updated

            if (widget.headBindingWidget) {
                widget.updatePointFromBinding('head')
            }
            if (widget.tailBindingWidget) {
                widget.updatePointFromBinding('tail')
            }
        }

        return addedWidgets
    }
}
