import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { WsEvents } from '@/types/Websocket.ts'
import { WS_EVENTS } from '@/helpers/Constant.ts'
import { Signal } from '@/core/signal/Signal.ts'

export class WebsocketEventService extends Service {
    eventDispatchers: Map<keyof typeof WS_EVENTS, Signal<WsEvents>>

    constructor(engine: Engine) {
        super(engine)
        this.eventDispatchers = new Map<
            keyof typeof WS_EVENTS,
            Signal<WsEvents>
        >()
        for (const key of Object.keys(WS_EVENTS)) {
            this.eventDispatchers.set(
                key as keyof typeof WS_EVENTS,
                new Signal<WsEvents>(),
            )
        }
        this.engine.wsEngine?.eventReceived.add(this.onEventReceived, this)
    }

    private onEventReceived(event: WsEvents) {
        this.eventDispatchers.get(event.event)?.dispatch(event)
    }

    dispose() {
        super.dispose()
        this.eventDispatchers.clear()
    }
}
