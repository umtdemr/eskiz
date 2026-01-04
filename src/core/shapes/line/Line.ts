import { Path as CkPath } from 'canvaskit-wasm'
import { Widget, WidgetProps } from '../Widget'
import { RGBA } from '../Color'
import { WidgetType } from '@/core/constants'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'

export interface LineProps extends WidgetProps {
    properties: LineProperties
}

export interface LineProperties {
    points: number[][]
    strokeColor?: RGBA
    // borderStyle?: BorderStyle // TODO: add it later
    strokeWidth?: number
    hasTailArrow?: boolean
    hasHeadArrow?: boolean
}

export class Line extends Widget {
    private _path: CkPath
    private _points: number[][] = []

    constructor(props: LineProps) {
        super(WidgetType.LINE, props)
        this._interactive = true
        this._points = props.properties.points

        this.updatePath()
    }

    get points() {
        return this._points
    }

    private updatePath() {
        if (this._path) {
            this._path.delete()
        }

        const path = new canvasKit.Path()

        const points = this._points.length
            ? this._points
            : [
                  [0, 0],
                  [10, 10],
              ]

        path.moveTo(points[0][0], points[0][1])

        for (const point of points) {
            path.lineTo(point[0], point[1])
        }

        this._path = path
    }

    setPoints(points: number[][]) {
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
            this.right - point[0],
            this.bottom - point[1],
        ])
        this.updatePath()
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        ctx.save()
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        paint.setStrokeWidth(2)
        paint.setColor(canvasKit.Color(0, 0, 0, 1))
        paint.setStyle(canvasKit.PaintStyle.Stroke)

        ctx.drawPath(this._path, paint)
        ctx.restore()
    }
}
