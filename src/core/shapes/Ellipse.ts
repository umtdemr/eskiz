import { Shape, ShapeProps } from '@/core/shapes/Shape.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetJson } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color'
import { BorderStyle } from '@/helpers/Constant'
import { ShapeType } from '@/core/constants.ts'
import { Engine } from '@/core/engine/Engine'

const TEXT_PADDING = 5

export class Ellipse extends Shape {
    constructor(props: ShapeProps, engine: Engine) {
        super(ShapeType.ELLIPSE, props, engine)
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

        const strokeWidth = this._properties.strokeWidth as number
        const strokeHalf = strokeWidth / 2
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
        paint.setStrokeWidth(strokeWidth)

        if (this._properties.borderStyle === BorderStyle.DOTTED) {
            const pathEffect = canvasKit.PathEffect.MakeDash(
                [strokeWidth, strokeWidth * 2],
                0,
            )
            paint.setPathEffect(pathEffect)
        } else if (this._properties.borderStyle === BorderStyle.DASHED) {
            const pathEffect = canvasKit.PathEffect.MakeDash(
                [strokeWidth * 5, strokeWidth * 5],
                0,
            )
            paint.setPathEffect(pathEffect)
        }

        ctx.drawOval(strokeEllipse, paint)
    }

    calcTextBounds(): { x: number; y: number; width: number; height: number } {
        const maxWidth = this._width / Math.sqrt(2)
        const maxHeight = this._height / Math.sqrt(2)

        const boxWidth = Math.max(0, maxWidth - TEXT_PADDING * 2)
        const boxHeight = Math.max(0, maxHeight - TEXT_PADDING * 2)

        return {
            x: (this._width - boxWidth) / 2,
            y: (this._height - boxHeight) / 2,
            width: boxWidth,
            height: boxHeight,
        }
    }

    toJson(): WidgetJson {
        return this.generateJson()
    }

    static loadFromJson(json: WsWidget, engine: Engine): Ellipse {
        return new Ellipse(json, engine)
    }
}
