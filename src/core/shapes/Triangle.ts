import { Shape, ShapeProps } from '@/core/shapes/Shape.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket.ts'
import { WidgetJson } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color'
import { BorderStyle } from '@/helpers/Constant'
import { ShapeType } from '@/core/constants.ts'
import { Engine } from '@/core/engine/Engine'
import { Paint, Path as CkPath } from 'canvaskit-wasm'

const TEXT_PADDING = 5

export class Triangle extends Shape {
    private paint: Paint | null = null
    private _fillPath: CkPath | null = null
    private _strokePath: CkPath | null = null
    private _cachedW = -1
    private _cachedH = -1
    private _cachedSW = -1

    constructor(props: ShapeProps, engine: Engine) {
        super(ShapeType.TRIANGLE, props, engine)
    }

    private ensurePaint(): Paint {
        if (!this.paint) {
            this.paint = new canvasKit.Paint()
            this.paint.setAntiAlias(true)
        }
        return this.paint
    }

    private ensurePaths(): { fillPath: CkPath; strokePath: CkPath } {
        const strokeWidth = this._properties.strokeWidth as number
        if (
            this._fillPath &&
            this._strokePath &&
            this._cachedW === this._width &&
            this._cachedH === this._height &&
            this._cachedSW === strokeWidth
        ) {
            return { fillPath: this._fillPath, strokePath: this._strokePath }
        }

        this._fillPath?.delete()
        this._strokePath?.delete()

        const fillPath = new canvasKit.Path()
        fillPath.moveTo(0, this.height)
        fillPath.lineTo(this.width / 2, 0)
        fillPath.lineTo(this.width, this.height)
        fillPath.lineTo(0, this.height)
        fillPath.close()

        const strokeHalf = strokeWidth / 2
        const strokePath = new canvasKit.Path()
        strokePath.moveTo(strokeHalf, this.height - strokeHalf)
        strokePath.lineTo(this.width / 2, strokeHalf)
        strokePath.lineTo(this.width - strokeHalf, this.height - strokeHalf)
        strokePath.lineTo(strokeHalf, this.height - strokeHalf)
        strokePath.close()

        this._fillPath = fillPath
        this._strokePath = strokePath
        this._cachedW = this._width
        this._cachedH = this._height
        this._cachedSW = strokeWidth

        return { fillPath, strokePath }
    }

    renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }

        const { fillPath, strokePath } = this.ensurePaths()
        const paint = this.ensurePaint()

        const strokeWidth = this._properties.strokeWidth as number

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(
            (this._properties.fillColor as RGBA).r,
            (this._properties.fillColor as RGBA).g,
            (this._properties.fillColor as RGBA).b,
            (this._properties.fillColor as RGBA).a,
        )
        paint.setColor(fillColor)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        ctx.drawPath(fillPath, paint)

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

        ctx.drawPath(strokePath, paint)
        paint.setPathEffect(null)
    }

    destroy() {
        this.paint?.delete()
        this.paint = null
        this._fillPath?.delete()
        this._strokePath?.delete()
        this._fillPath = null
        this._strokePath = null
        super.destroy()
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
        return [
            this.getPointFromRelative(0, -1), // top middle
            this.getPointFromRelative(-1, 1), // bottom left
            this.getPointFromRelative(1, 1), // bottom right
            this.getPointFromRelative(-0.5, 0), // left slant mid
            this.getPointFromRelative(0.5, 0), // right slant mid
            this.getPointFromRelative(0, 1), // bottom mid
        ]
    }
}
