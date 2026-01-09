import {
    Path as CkPath,
    Paint as CkPaint,
    Canvas as SkiaCanvas,
} from 'canvaskit-wasm'
import { Widget, WidgetProps } from '../Widget'
import { RGBA } from '../Color'
import { WidgetType } from '@/core/constants'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'

export interface LineProps extends WidgetProps {
    properties: LineProperties
}

export interface LineProperties {
    points: [number, number][]
    strokeColor?: RGBA
    // borderStyle?: BorderStyle // TODO: add it later
    strokeWidth?: number
    hasTailArrow?: boolean
    hasHeadArrow?: boolean
}

export class Line extends Widget {
    private _path: CkPath
    private _points: [number, number][] = []
    private _hasTailArrow: boolean
    private _hasHeadArrow: boolean
    private _arrowSize = 5

    private _arrowPath: CkPath | null = null
    private _paint: CkPaint | null = null

    constructor(props: LineProps) {
        super(WidgetType.LINE, props)
        this._interactive = true
        this._points = props.properties.points
        this._hasHeadArrow = !!props.properties.hasHeadArrow
        this._hasTailArrow = !!props.properties.hasTailArrow

        this.updatePath()
    }

    private updatePath() {
        if (this._path) {
            this._path.delete()
        }

        if (!this._points.length) {
            return
        }

        const path = new canvasKit.Path()

        const points = this._points

        path.moveTo(points[0][0], points[0][1])

        for (const point of points) {
            path.lineTo(point[0], point[1])
        }

        if (this._hasHeadArrow || this._hasTailArrow) {
            this.updateArrowPath()
        }

        this._path = path
    }

    private updateArrowPath() {
        if (this._arrowPath) {
            this._arrowPath.delete()
            this._arrowPath = null
        }

        if (this._points.length < 2) {
            return
        }

        const path = new canvasKit.Path()
        path.moveTo(-this._arrowSize, 0)
        path.lineTo(-this._arrowSize - 2, this._arrowSize)
        path.lineTo(0, 0)
        path.lineTo(-this._arrowSize - 2, -this._arrowSize)
        path.lineTo(-this._arrowSize, 0)
        this._arrowPath = path
    }

    private _drawArrow(
        ctx: SkiaCanvas,
        arrowLocation: [number, number],
        controlPoint: [number, number],
    ) {
        if (!this._arrowPath || !this._paint) {
            return
        }

        const dx = arrowLocation[0] - controlPoint[0]
        const dy = arrowLocation[1] - controlPoint[1]
        const r = Math.atan2(dy, dx) * (180 / Math.PI)

        ctx.translate(arrowLocation[0], arrowLocation[1])
        ctx.rotate(r, 0, 0)
        this._paint.setStyle(canvasKit.PaintStyle.Fill)
        ctx.drawPath(this._arrowPath, this._paint)
        this._paint.setStyle(canvasKit.PaintStyle.Stroke)
        ctx.drawPath(this._arrowPath, this._paint)
    }

    setPoints(points: [number, number][]) {
        this._points = points
        this.updatePath()
    }

    /**
     * Updates line's bound from points and sets points relative
     */
    setBoundsFromPoints() {
        // TODO: fix this
        const bounds = this._path.getBounds()

        //         const m = this._path.copy()
        // const success = m.stroke({
        //     width: 2,
        //     cap: canvasKit.StrokeCap.Butt,
        //     join: canvasKit.StrokeJoin.Miter,
        //     miter_limit: 4,
        // })
        // const k = m.getBounds()
        // this.left = k[0]
        // this.top = k[1]
        // this.width = k[2] - k[0]
        // this.height = k[3] - k[1]
        // m.delete()

        // set line's bound first
        this.left = bounds[0]
        this.top = bounds[1]
        this.width = bounds[2] - bounds[0]
        this.height = bounds[3] - bounds[1]

        // update to relative points
        this._points = this._points.map((point) => [
            this.right - point[0],
            this.bottom - point[1],
        ])
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (!this._paint) {
            this._paint = new canvasKit.Paint()
            this._paint.setAntiAlias(true)
            this._paint.setStrokeWidth(20)
            this._paint.setColor(canvasKit.Color(0, 0, 0, 1))
            this._paint.setStrokeJoin(canvasKit.StrokeJoin.Round)
        }

        // draw line
        this._paint.setStyle(canvasKit.PaintStyle.Stroke)
        ctx.drawPath(this._path, this._paint)

        // draw arrows if there is
        if (this._hasHeadArrow && this._arrowPath) {
            const arrowLocation = this._points[this._points.length - 1]
            const controlPoint = this.points[this.points.length - 2]

            ctx.save()
            this._drawArrow(ctx, arrowLocation, controlPoint)
            ctx.restore()
        }
        if (this._hasTailArrow && this._arrowPath) {
            const arrowLocation = this._points[0]
            const controlPoint = this.points[1]

            ctx.save()
            this._drawArrow(ctx, arrowLocation, controlPoint)
            ctx.restore()
        }
    }

    get points() {
        return this._points
    }
}
