import { WidgetFactory } from '@/core/engine/WidgetFactory.ts'
import { Rectangle } from '@/core/shapes/Rectangle.ts'
import { Ellipse } from '@/core/shapes/Ellipse.ts'
import { Triangle } from '@/core/shapes/Triangle.ts'
import { TextBox } from '@/core/shapes/text/TextBox.ts'
import { Pen } from '@/core/shapes/path/Pen.ts'
import {
    LineType,
    PathType,
    ShapeType,
    TextType,
    WidgetType,
    ImageType,
    StickyNoteType,
} from '@/core/constants.ts'
import { Image } from '@/core/shapes/image/Image'
import { Line } from '@/core/shapes/line/Line'
import { StickyNote } from '@/core/shapes/stickyNote/StickyNote'

export function initializeAllWidgets() {
    WidgetFactory.registerWidget(
        WidgetType.SHAPE,
        ShapeType.RECTANGLE,
        Rectangle,
    )
    WidgetFactory.registerWidget(WidgetType.SHAPE, ShapeType.ELLIPSE, Ellipse)
    WidgetFactory.registerWidget(WidgetType.SHAPE, ShapeType.TRIANGLE, Triangle)
    WidgetFactory.registerWidget(WidgetType.TEXTBOX, TextType.TEXTBOX, TextBox)
    WidgetFactory.registerWidget(WidgetType.PATH, PathType.PEN, Pen)
    WidgetFactory.registerWidget(WidgetType.LINE, LineType.LINE, Line)
    WidgetFactory.registerWidget(WidgetType.IMAGE, ImageType.IMAGE, Image)
    WidgetFactory.registerWidget(
        WidgetType.STICKY_NOTE,
        StickyNoteType.STICKY_NOTE,
        StickyNote,
    )
}
