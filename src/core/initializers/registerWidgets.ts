import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'
import { Rectangle } from '@/core/shapes/Rectangle.ts'
import { Ellipse } from '@/core/shapes/Ellipse.ts'
import { Triangle } from '@/core/shapes/Triangle.ts'
import { TextBox } from '@/core/shapes/text/TextBox.ts'
import { Pen } from '@/core/shapes/path/Pen.ts'
import {
    PathType,
    ShapeType,
    TextType,
    WidgetType,
} from '@/core/constants.ts'

export function initializeAllWidgets() {
    WidgetFactory.registerWidget(WidgetType.SHAPE, ShapeType.RECTANGLE, Rectangle)
    WidgetFactory.registerWidget(WidgetType.SHAPE, ShapeType.ELLIPSE, Ellipse)
    WidgetFactory.registerWidget(WidgetType.SHAPE, ShapeType.TRIANGLE, Triangle)
    WidgetFactory.registerWidget(WidgetType.TEXTBOX, TextType.TEXTBOX, TextBox)
    WidgetFactory.registerWidget(WidgetType.PATH, PathType.PEN, Pen)
}
