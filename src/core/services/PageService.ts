import { Service } from '@/core/services/Service.ts'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'
import { Widget } from '../shapes/Widget'
import { Line } from '@/core/shapes/line/Line'

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

        // const images = []
        // let col = 0
        // let row = 0
        // for (let i = 0; i < 2000; i++) {
        //     let x = col * 400 + 400
        //     let y = row * 400 + 400

        //     x += col * 200
        //     y += row * 200

        //     col++
        //     if (col > 20) {
        //         col = 0
        //         row++
        //     }
        //     images.push(
        //         new Image(
        //             {
        //                 width: 400,
        //                 height: 400,
        //                 x: x,
        //                 y: y,
        //                 properties: {},
        //             },
        //             this.engine,
        //         ),
        //     )
        // }
        // widgetLayer.addChildren(...images)

        return addedWidgets
    }
}
