import {WidgetFactory} from "@/core/engine/WidgetFactory.ts";
import {Rectangle} from "@/core/shapes/Rectangle.ts";

export function initializeAllWidgets() {
    WidgetFactory.registerWidget('shape', 'rectangle', Rectangle)
}