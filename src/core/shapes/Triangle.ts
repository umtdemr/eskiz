import { Shape, ShapeProps } from '@/core/shapes/Shape.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetJson } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color'
import { BorderStyle } from '@/helpers/Constant'
import { ShapeType } from '@/core/constants.ts'
import { Engine } from '@/core/engine/Engine'

const TEXT_PADDING = 5

export class Triangle extends Shape {
    constructor(props: ShapeProps, engine: Engine) {
        super(ShapeType.TRIANGLE, props, engine)
    }

    renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        const path = new canvasKit.Path()
        path.moveTo(0, this.height) // Bottom left
        path.lineTo(this.width / 2, 0) // Top middle
        path.lineTo(this.width, this.height) // Bottom right
        path.lineTo(0, this.height) // Back to bottom left
        path.close()

        const strokeWidth = this._properties.strokeWidth as number
        const strokeHalf = strokeWidth / 2
        const pathStroke = new canvasKit.Path()
        pathStroke.moveTo(strokeHalf, this.height - strokeHalf)
        pathStroke.lineTo(this.width / 2, strokeHalf)
        pathStroke.lineTo(this.width - strokeHalf, this.height - strokeHalf)
        pathStroke.lineTo(strokeHalf, this.height - strokeHalf)
        pathStroke.close()

        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(
            (this._properties.fillColor as RGBA).r,
            (this._properties.fillColor as RGBA).g,
            (this._properties.fillColor as RGBA).b,
            (this._properties.fillColor as RGBA).a,
        )
        paint.setColor(fillColor)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        ctx.drawPath(path, paint)

        paint.setStrokeWidth(strokeWidth)
        const strokeColor = canvasKit.Color(
            (this._properties.strokeColor as RGBA).r,
            (this._properties.strokeColor as RGBA).g,
            (this._properties.strokeColor as RGBA).b,
            (this._properties.strokeColor as RGBA).a,
        )
        paint.setColor(strokeColor)
        paint.setStyle(canvasKit.PaintStyle.Stroke)

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

        ctx.drawPath(pathStroke, paint)
    }

    calcTextBounds(): { x: number; y: number; width: number; height: number } {
        const maxWidth = this._width / 2
        const maxHeight = this._height / 2

        const boxWidth = Math.max(0, maxWidth - TEXT_PADDING * 2)
        const boxHeight = Math.max(0, maxHeight - TEXT_PADDING * 2)

        return {
            x: (this._width - boxWidth) / 2,
            y: this._height - boxHeight,
            width: boxWidth,
            height: boxHeight,
        }
    }

    toJson(): WidgetJson {
        return this.generateJson()
    }

    static loadFromJson(json: WsWidget, engine: Engine): Triangle {
        return new Triangle(json, engine)
    }

    getSnapPoints(): { x: number; y: number }[] {
        // triangle points:
        // top middle: (this.width / 2, 0)
        // bottom left: (0, this.height)
        // bottom right: (this.width, this.height)

        const topMiddle = {
            x: this.bounds.x + this.width / 2,
            y: this.bounds.y,
        }
        const bottomLeft = {
            x: this.bounds.x,
            y: this.bounds.y + this.height,
        }
        const bottomRight = {
            x: this.bounds.x + this.width,
            y: this.bounds.y + this.height,
        }

        // midpoints of slanted sides
        // left slant (bottom left to top middle)
        const leftSlantMid = {
            x: (bottomLeft.x + topMiddle.x) / 2,
            y: (bottomLeft.y + topMiddle.y) / 2,
        }
        // right slant (bottom right to top middle)
        const rightSlantMid = {
            x: (bottomRight.x + topMiddle.x) / 2,
            y: (bottomRight.y + topMiddle.y) / 2,
        }

        // midpoint of bottom side
        const bottomMid = {
            x: (bottomLeft.x + bottomRight.x) / 2,
            y: (bottomLeft.y + bottomRight.y) / 2,
        }

        return [
            topMiddle,
            bottomLeft,
            bottomRight,
            leftSlantMid,
            rightSlantMid,
            bottomMid,
        ]
    }
}
