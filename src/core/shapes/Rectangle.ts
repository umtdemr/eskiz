import { Shape, ShapeProperties, ShapeProps } from '@/core/shapes/Shape.ts'
import { BorderStyle, SHAPES } from '@/helpers/Constant.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WidgetJson } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color'

export interface RectangleProps extends ShapeProps {
    properties: RectangleShapeProperties
}

export interface RectangleShapeProperties extends ShapeProperties {
    radius?: number
}

const TEXT_PADDING = 5

export class Rectangle extends Shape {
    constructor(props: RectangleProps) {
        super(SHAPES.RECTANGLE, props)
        if (props.properties?.radius) {
            this._properties.radius =
                props.properties.radius >= 0 && props.properties.radius <= 20
                    ? props.properties.radius!
                    : 0
        }
    }

    protected renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }

        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        let rect = canvasKit.LTRBRect(0, 0, this._width, this._height)

        // since border width grows to inward and outward, we don't want it to look like outside the bounding box,
        // so here, we just adjust te position of rectangle for drawing border
        const strokeWidth = this._properties.strokeWidth as number
        const strokeHalf = strokeWidth / 2
        let strokeRect = canvasKit.LTRBRect(
            0 + strokeHalf,
            0 + strokeHalf,
            this._width - strokeHalf,
            this._height - strokeHalf,
        )

        const radius = this._properties.radius as number

        // method to call draw rect in canvas kit
        const drawFn = radius > 0 ? 'drawRRect' : 'drawRect'

        // if this has radius, create radius rect
        if (radius > 0) {
            rect = canvasKit.RRectXY(rect, radius, radius)
            strokeRect = canvasKit.RRectXY(strokeRect, radius, radius)
        }

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

        if (drawFn === 'drawRRect') {
            ctx.drawRRect(rect, paint)
        } else {
            ctx.drawRect(rect, paint)
        }

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

        if (drawFn === 'drawRRect') {
            ctx.drawRRect(strokeRect, paint)
        } else {
            ctx.drawRect(strokeRect, paint)
        }
    }

    calcTextBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: TEXT_PADDING,
            y: TEXT_PADDING,
            width: this._width - TEXT_PADDING * 2,
            height: this._height - TEXT_PADDING * 2,
        }
    }

    canChangeRoundness(): boolean {
        return true
    }

    changeRoundness(newRadius: number): boolean {
        if (this._properties.radius === newRadius) return false
        this._properties.radius = newRadius
        return true
    }

    toJson(): WidgetJson {
        return this.generateJson()
    }

    static loadFromJson(json: RectangleProps): Rectangle {
        return new Rectangle(json)
    }
}
