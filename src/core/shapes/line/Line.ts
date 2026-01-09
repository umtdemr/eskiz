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
    private _strokeWidth = 2
    private _strokeColor: RGBA = { r: 0, g: 0, b: 0, a: 1 }

    private _arrowPath: CkPath | null = null
    private _paint: CkPaint | null = null

    constructor(props: LineProps) {
        super(WidgetType.LINE, props)
        this._interactive = true
        this._points = props.properties.points
        this._hasHeadArrow = !!props.properties.hasHeadArrow
        this._hasTailArrow = !!props.properties.hasTailArrow
        
        this._strokeWidth = props.properties.strokeWidth || 2
        this._strokeColor = props.properties.strokeColor || {
            r: 0,
            g: 0,
            b: 0,
            a: 1,
        }

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
        
        const strokeWidth = this._strokeWidth || 2
        this._arrowSize = strokeWidth * 2.5
        const vOffset = strokeWidth

        const path = new canvasKit.Path()
        path.moveTo(-this._arrowSize, 0)
        path.lineTo(-this._arrowSize - vOffset, this._arrowSize)
        path.lineTo(0, 0)
        path.lineTo(-this._arrowSize - vOffset, -this._arrowSize)
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
        const bounds = this._path.getBounds()

        // set line's bound first
        this.left = bounds[0]
        this.top = bounds[1]
        this.width = bounds[2] - bounds[0]
        this.height = bounds[3] - bounds[1]
        // update to relative points
        this._points = this._points.map((point) => [
            point[0] - this.left,
            point[1] - this.top,
        ])

        this.updatePath()
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (!this._paint) {
            this._paint = new canvasKit.Paint()
            this._paint.setAntiAlias(true)

            const strokeWidth = this._strokeWidth || 2
            const strokeColor = this._strokeColor || { r:0, g:0, b:0, a:1 }

            this._paint.setStrokeWidth(strokeWidth)
            this._paint.setColor(canvasKit.Color(strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a))
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
    
    canChangeBorderColor(): boolean {
        return true
    }

    canChangeThickness(): boolean {
        return true
    }

    // returns points
    get points() {
        return this._points
    }

    // returns points in actual coordinates
    get absolutePoints() {
        return this._points.map((point) => [
            this.left + point[0],
            this.top + point[1],
        ])
    }

    contains(x: number, y: number, scale: number = 1): boolean {
        const tolerance = 10 / scale

        const lx = x - this.bounds.x
        const ly = y - this.bounds.y

        // check if point is roughly within the bounding box
        if (
            lx < -tolerance ||
            lx > this.bounds.width + tolerance ||
            ly < -tolerance ||
            ly > this.bounds.height + tolerance
        ) {
            return false
        }

        // check if point is on the line
        for (let i = 0; i < this._points.length - 1; i++) {
            const p1 = this._points[i]
            const p2 = this._points[i + 1]
            if (
                distanceToSegment(
                    { x: lx, y: ly },
                    { x: p1[0], y: p1[1] },
                    { x: p2[0], y: p2[1] },
                ) <= tolerance
            ) {
                return true
            }
        }
        return false
    }
}

function distanceToSegment(
    p: { x: number; y: number },
    v: { x: number; y: number },
    w: { x: number; y: number },
): number {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2)
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
    t = Math.max(0, Math.min(1, t))
    return Math.sqrt(
        (p.x - (v.x + t * (w.x - v.x))) ** 2 +
            (p.y - (v.y + t * (w.y - v.y))) ** 2,
    )
}
