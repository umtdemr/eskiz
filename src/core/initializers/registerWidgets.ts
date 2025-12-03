import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'
import { Rectangle } from '@/core/shapes/Rectangle.ts'
import { Ellipse } from '@/core/shapes/Ellipse.ts'
import { Triangle } from '@/core/shapes/Triangle.ts'
import { TextBox } from '@/core/shapes/text/TextBox.ts'

export function initializeAllWidgets() {
    WidgetFactory.registerWidget('shape', 'rectangle', Rectangle)
    WidgetFactory.registerWidget('shape', 'ellipse', Ellipse)
    WidgetFactory.registerWidget('shape', 'triangle', Triangle)
    WidgetFactory.registerWidget('textbox', 'textbox', TextBox)
}
