import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { AddWidgetPayload } from '@/types/Websocket.ts'

export class WidgetsService extends Service {
    constructor(engine: Engine) {
        super(engine)
    }

    async addWidget(params: AddWidgetPayload) {
        return await this.engine.wsEngine.sendAsyncMessage<'addWidget'>({
            type: 'addWidget',
            data: params,
        })
    }
}
