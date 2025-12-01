import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { AddWidgetPayload, WsEvents } from '@/types/Websocket.ts'
import { WebsocketEventService } from '@/core/services/WebsocketEventService'
import { WS_EVENTS } from '@/helpers/Constant'
import { WidgetFactory } from '../engine/WidgetFactory'
import { Widget } from '../shapes/Widget'
import { Signal } from '../signal/Signal'

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

        const widgetClass = WidgetFactory.loadFromJson(event.data.widget)
        if (!widgetClass) {
            return
        }
        widgetLayer.addChildren(widgetClass)
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

                if (shape.data.is_deleted && widget.parent) {
                    widget.parent.removeChild(widget)
                }
            }
        }

        this.engine.canvas.requestRender()
    }

    deleteWidget(widget: Widget) {
        widget.delete()
        widget.isDeleted = true
        widget.deleted.dispatch()
        widget.parent?.removeChild(widget)

        this.widgetDeleted.dispatch({ widgets: [widget] })
    }

    toggleLockState(widget: Widget) {
        widget.isLocked = !widget.isLocked
        this.widgetLockStateChanged.dispatch({ widgets: [widget] })
    }
}
