import { Shape, ShapeProps } from '@/core/shapes/Shape.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetJson } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color'

export class Ellipse extends Shape {
    constructor(props: ShapeProps) {
        super('ellipse', props)
    }

    renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx

        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)

        const ellipse = canvasKit.LTRBRect(0, 0, this._width, this._height)

        const strokeHalf = 1
        const strokeEllipse = canvasKit.LTRBRect(
            0 + strokeHalf,
            0 + strokeHalf,
            this.width - strokeHalf,
            this._height - strokeHalf,
        )

        // draw fill
        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(
            (this._properties.fillColor as RGBA).r,
            (this._properties.fillColor as RGBA).g,
            (this._properties.fillColor as RGBA).b,
            (this._properties.fillColor as RGBA).a,
        )
        paint.setColor(fillColor)
        paint.setStyle(canvasKit.PaintStyle.Fill)

        ctx.drawOval(ellipse, paint)

        // draw stroke
        const strokeColor = canvasKit.Color(
            (this._properties.strokeColor as RGBA).r,
            (this._properties.strokeColor as RGBA).g,
            (this._properties.strokeColor as RGBA).b,
            (this._properties.strokeColor as RGBA).a,
        )
        paint.setColor(strokeColor)
        paint.setStyle(canvasKit.PaintStyle.Stroke)
        paint.setStrokeWidth(2)
        ctx.drawOval(strokeEllipse, paint)
    }

    toJson(): WidgetJson {
        return this.generateJson()
    }

    static loadFromJson(json: WsWidget): Ellipse {
        return new Ellipse(json)
    }
}
