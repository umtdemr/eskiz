import {Service} from "@/core/services/Service.ts";
import {Engine} from "@/core/engine/Engine.ts";
import {AddWidgetPayload, WsWidget} from "@/types/Websocket.ts";
import {Layer} from "@/core/stage/Layer.ts";
import {WidgetFactory} from "@/core/engine/WidgetFactory.ts";


export class WidgetsService extends Service {
    constructor(engine: Engine) {
        super(engine);
    }

    private async addWidget(params: AddWidgetPayload) {
        const widget = await this.engine.wsEngine.sendAsyncMessage<"addWidget">({
            type: 'addWidget',
            data: params
        })

        return widget;
    }

    loadWidgets(widgets: WsWidget[], widgetLayer: Layer): void {
        for (const widget of widgets) {
            const widgetClass = WidgetFactory.loadFromJson(widget);
            if (!widgetClass) {
                continue;
            }

            widgetLayer.addChildren(widgetClass);
        }
    }
}