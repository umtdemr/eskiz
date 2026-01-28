import { Engine } from '@/core/engine/Engine'
import {
    DbWidgetType,
    SubType,
    Widget,
    WidgetFullType,
} from '@/core/shapes/Widget.ts'
import { WsWidget } from '@/types/Websocket.ts'

interface WidgetConstructor {
    loadFromJson(json: unknown, engine: Engine): Widget
}

export class WidgetFactory {
    static _registry: Map<WidgetFullType, WidgetConstructor> = new Map()

    static registerWidget(
        widgetType: DbWidgetType,
        subType: SubType,
        widget: WidgetConstructor,
    ) {
        const key = `${widgetType}_${subType}` as WidgetFullType
        if (WidgetFactory._registry.has(key)) {
            console.warn(
                `Widget registry with key "${key}" is already registered. Overwriting.`,
            )
        }

        WidgetFactory._registry.set(key, widget)
    }

    static loadFromJson(data: WsWidget, engine: Engine) {
        const key = `${data.widget_type}_${data.sub_type}` as WidgetFullType
        const WidgetClass = WidgetFactory._registry.get(key)
        if (!WidgetClass) {
            console.error(
                `Unknown widget type: ${data.widget_type}, sub_type: ${data.sub_type}`,
            )
            return
        }

        return WidgetClass.loadFromJson(data, engine)
    }
}
