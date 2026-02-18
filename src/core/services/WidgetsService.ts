import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { AddWidgetPayload, WsEvents } from '@/types/Websocket.ts'
import { WebsocketEventService } from '@/core/services/WebsocketEventService'
import { WS_EVENTS } from '@/helpers/Constant'
import { WidgetFactory } from '../engine/WidgetFactory'
import { Widget } from '../shapes/Widget'
import { Signal } from '../signal/Signal'
import { Line } from '../shapes/line/Line'

export interface WidgetDeletedSignal {
    widgets: Widget[]
}
export interface WidgetLockStateChangedSignal {
    widgets: Widget[]
}

export class WidgetsService extends Service {
    private wsEventService: WebsocketEventService

    widgetDeleted = new Signal<WidgetDeletedSignal>()
    widgetLockStateChanged = new Signal<WidgetLockStateChangedSignal>()

    constructor(engine: Engine, wsEventService: WebsocketEventService) {
        super(engine)
        this.wsEventService = wsEventService
        this.wsEventService.eventDispatchers
            .get(WS_EVENTS.WIDGET_ADDED)
            ?.add(this.onWidgetAdded, this)
        this.wsEventService.eventDispatchers
            .get(WS_EVENTS.WIDGET_UPDATED)
            ?.add(this.onWidgetUpdated, this)
    }

    async addWidget(params: AddWidgetPayload) {
        return await this.engine.wsEngine.sendAsyncMessage<'addWidget'>({
            type: 'addWidget',
            data: params,
        })
    }

    private onWidgetAdded(event: WsEvents) {
        if (event.event !== WS_EVENTS.WIDGET_ADDED) {
            return
        }

        const widgetLayer = this.engine.stage.widgetsDefaultLayer
        // TODO: prevent duplicates

        const widgetClass = WidgetFactory.loadFromJson(
            event.data.widget,
            this.engine,
        )
        if (!widgetClass) {
            return
        }
        widgetLayer.addChildren(widgetClass)

        if (widgetClass instanceof Line) {
            widgetClass.resolveBindings(widgetLayer)
        } else {
            // if a widget is added, existing lines might want to bind to it
            // TODO: is this the best way to do this?
            const addedWidget = widgetClass
            for (const child of widgetLayer.children) {
                if (child instanceof Line) {
                    if (
                        child.headBinding?.id === addedWidget.uuid &&
                        !child.headBindingWidget
                    ) {
                        child.headBindingWidget = addedWidget
                        addedWidget.addAttachedLine(child)
                        child.updatePointFromBinding('head')
                    }
                    if (
                        child.tailBinding?.id === addedWidget.uuid &&
                        !child.tailBindingWidget
                    ) {
                        child.tailBindingWidget = addedWidget
                        addedWidget.addAttachedLine(child)
                        child.updatePointFromBinding('tail')
                    }
                }
            }
        }

        this.engine.canvas.requestRender()
    }

    private onWidgetUpdated(event: WsEvents) {
        if (event.event !== WS_EVENTS.WIDGET_UPDATED) {
            return
        }
        const widgetLayer = this.engine.stage.widgetsDefaultLayer

        for (const shape of event.data.transaction.shapes) {
            for (const widget of widgetLayer.children) {
                if (!(widget instanceof Widget) || widget.uuid !== shape.uuid) {
                    continue
                }

                widget.updateWithPartialState(shape.data)

                if (widget instanceof Line) {
                    widget.resolveBindings(widgetLayer)
                }
            }
        }

        this.engine.canvas.requestRender()
    }

    deleteWidget(widget: Widget) {
        // note: I'm just setting isDeleted here, the actual removal is not happening
        widget.delete()
        this.widgetDeleted.dispatch({ widgets: [widget] })
    }

    toggleLockState(widget: Widget) {
        widget.isLocked = !widget.isLocked
        this.widgetLockStateChanged.dispatch({ widgets: [widget] })
    }
}
