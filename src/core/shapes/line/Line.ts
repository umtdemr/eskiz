import {
    Path as CkPath,
    Paint as CkPaint,
    Canvas as SkiaCanvas,
} from 'canvaskit-wasm'
import { Widget, WidgetJson, WidgetProps } from '../Widget'
import { RGBA } from '../Color'
import { LineType, WidgetType } from '@/core/constants'
import { BorderStyle } from '@/helpers/Constant'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket'
import { Layer } from '@/core/stage/Layer'

export interface LineProps extends WidgetProps {
    properties: LineProperties
}

export interface LineBinding {
    id: string
    rx: number
    ry: number
}

export interface LineProperties {
    points: [number, number][]
    strokeColor?: RGBA
    borderStyle?: BorderStyle
    strokeWidth?: number
    hasTailArrow?: boolean
    hasHeadArrow?: boolean
    headBinding?: LineBinding
    tailBinding?: LineBinding
}

export class Line extends Widget {
    private _path: CkPath
    private _points: [number, number][] = []
    private _hasTailArrow: boolean
    private _hasHeadArrow: boolean
    private _arrowSize = 5
    private _strokeWidth = 2
    private _strokeColor: RGBA = { r: 0, g: 0, b: 0, a: 1 }
    private _borderStyle: BorderStyle = BorderStyle.SOLID
    private _headBinding: LineBinding | null = null
    private _tailBinding: LineBinding | null = null
    public headBindingWidget: Widget | null = null
    public tailBindingWidget: Widget | null = null

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
        this._borderStyle = props.properties.borderStyle || BorderStyle.SOLID
        this._headBinding = props.properties.headBinding || null
        this._tailBinding = props.properties.tailBinding || null

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
        const newLeft = bounds[0]
        const newTop = bounds[1]
        const newWidth = bounds[2] - bounds[0]
        const newHeight = bounds[3] - bounds[1]

        // update to relative points
        this._points = this._points.map((point) => [
            point[0] - newLeft,
            point[1] - newTop,
        ])

        // set line's bound after updating points to relative
        // so when boundsChanged event fired, points are already relative
        this.left = newLeft
        this.top = newTop
        this.width = newWidth
        this.height = newHeight

        this.updatePath()
    }

    updateFromAbsolutePoints(points: [number, number][]) {
        this._points = points
        // calculate new path in absolute coordinates
        this.updatePath()
        // calculate new bounds and relativize points
        this.setBoundsFromPoints()
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (!this._paint) {
            this._paint = new canvasKit.Paint()
            this._paint.setAntiAlias(true)

            const strokeWidth = this._strokeWidth || 2
            const strokeColor = this._strokeColor || { r: 0, g: 0, b: 0, a: 1 }

            this._paint.setStrokeWidth(strokeWidth)
            this._paint.setColor(
                canvasKit.Color(
                    strokeColor.r,
                    strokeColor.g,
                    strokeColor.b,
                    strokeColor.a,
                ),
            )
            this._paint.setStrokeJoin(canvasKit.StrokeJoin.Round)
        }

        // draw line
        this._paint.setStyle(canvasKit.PaintStyle.Stroke)

        const strokeWidth = this._strokeWidth || 2

        // apply path effect for border styles
        if (this._borderStyle === BorderStyle.DOTTED) {
            const pathEffect = canvasKit.PathEffect.MakeDash(
                [0, strokeWidth * 2],
                0,
            )
            this._paint.setPathEffect(pathEffect)
            this._paint.setStrokeCap(canvasKit.StrokeCap.Round)
        } else if (this._borderStyle === BorderStyle.DASHED) {
            const pathEffect = canvasKit.PathEffect.MakeDash(
                [strokeWidth * 5, strokeWidth * 5],
                0,
            )
            this._paint.setPathEffect(pathEffect)
            this._paint.setStrokeCap(canvasKit.StrokeCap.Butt)
        } else {
            this._paint.setPathEffect(null)
            this._paint.setStrokeCap(canvasKit.StrokeCap.Butt)
        }

        ctx.drawPath(this._path, this._paint)

        // remove path effect for arrows so they are solid
        this._paint.setPathEffect(null)
        // reset stroke cap to default
        this._paint.setStrokeCap(canvasKit.StrokeCap.Butt)

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

    changeBorderColor(newColor: RGBA): boolean {
        this._strokeColor = newColor
        // force paint update
        if (this._paint) this._paint.delete()
        this._paint = null
        return true
    }

    canChangeBorderStyle(): boolean {
        return true
    }

    changeBorderStyle(newStyle: BorderStyle): boolean {
        if (this._borderStyle === newStyle) return false
        this._borderStyle = newStyle
        // force paint update
        if (this._paint) this._paint.delete()
        this._paint = null
        return true
    }

    canChangeThickness(): boolean {
        return true
    }

    changeThickness(thickness: number): boolean {
        if (this._strokeWidth === thickness) return false
        this._strokeWidth = thickness
        // force paint update
        if (this._paint) this._paint.delete()
        this._paint = null

        this.updatePath()
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

    toJson(): WidgetJson {
        const data: WidgetJson = {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: WidgetType.LINE,
            sub_type: LineType.LINE,
            properties: {
                points: this._points,
                strokeColor: this._strokeColor,
                strokeWidth: this._strokeWidth,
                hasHeadArrow: this._hasHeadArrow,
                hasTailArrow: this._hasTailArrow,
                borderStyle: this._borderStyle,
            },
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
        }

        if (this._parent_widget_id) {
            data.parent_widget_id = this._parent_widget_id
        }

        if (this._headBinding) {
            data.properties.headBinding = this._headBinding
        }

        if (this._tailBinding) {
            data.properties.tailBinding = this._tailBinding
        }

        return data
    }

    static loadFromJson(json: WsWidget): Line {
        const properties = json.properties as unknown as LineProperties
        return new Line({
            x: json.x,
            y: json.y,
            width: json.width,
            height: json.height,
            uuid: json.uuid,
            z_index: json.z_index,
            parent_widget_id: json.parent_widget_id,
            is_locked: json.is_locked,
            properties: {
                points: properties.points,
                strokeColor: properties.strokeColor,
                strokeWidth: properties.strokeWidth,
                hasHeadArrow: properties.hasHeadArrow,
                hasTailArrow: properties.hasTailArrow,
                borderStyle: properties.borderStyle,
                headBinding: properties.headBinding,
                tailBinding: properties.tailBinding,
            },
        })
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

        if (json.properties) {
            const properties = json.properties as Partial<LineProperties>
            if (properties.points) {
                this.setPoints(properties.points)
            }
            if (properties.strokeColor) {
                this._strokeColor = properties.strokeColor
                // force paint update
                if (this._paint) this._paint.delete()
                this._paint = null
            }
            if (properties.strokeWidth) {
                this._strokeWidth = properties.strokeWidth
                // force paint update
                if (this._paint) this._paint.delete()
                this._paint = null

                this.updatePath()
            }
            if (properties.hasHeadArrow !== undefined) {
                this._hasHeadArrow = properties.hasHeadArrow
                this.updatePath()
            }
            if (properties.hasTailArrow !== undefined) {
                this._hasTailArrow = properties.hasTailArrow
                this.updatePath()
            }
            if (properties.borderStyle) {
                this._borderStyle = properties.borderStyle
                // force paint update
                if (this._paint) this._paint.delete()
                this._paint = null
            }
            if (properties.headBinding !== undefined) {
                this._headBinding = properties.headBinding || null
                if (this._headBinding) {
                    this.updatePointFromBinding('head')
                }
            }
            if (properties.tailBinding !== undefined) {
                this._tailBinding = properties.tailBinding || null
                if (this._tailBinding) {
                    this.updatePointFromBinding('tail')
                }
            }
        }
    }

    canChangeArrows(): boolean {
        return true
    }

    changeArrows(hasHeadArrow: boolean, hasTailArrow: boolean): boolean {
        let changed = false
        if (this._hasHeadArrow !== hasHeadArrow) {
            this._hasHeadArrow = hasHeadArrow
            changed = true
        }
        if (this._hasTailArrow !== hasTailArrow) {
            this._hasTailArrow = hasTailArrow
            changed = true
        }
        if (changed) {
            this.updatePath()
            // force paint update
            if (this._paint) this._paint.delete()
            this._paint = null
        }
        return changed
    }

    resolveBindings(widgetLayer: Layer) {
        if (this._headBinding) {
            if (
                this.headBindingWidget &&
                this.headBindingWidget.uuid === this._headBinding.id
            ) {
                this.headBindingWidget.addAttachedLine(this)
            } else {
                let foundWidget: Widget | null = null
                for (const w of widgetLayer.children) {
                    if (
                        w instanceof Widget &&
                        w.uuid === this._headBinding.id
                    ) {
                        foundWidget = w
                        break
                    }
                }

                if (foundWidget) {
                    this.headBindingWidget = foundWidget
                    foundWidget.addAttachedLine(this)
                }
            }
        }
        if (this._tailBinding) {
            if (
                this.tailBindingWidget &&
                this.tailBindingWidget.uuid === this._tailBinding.id
            ) {
                this.tailBindingWidget.addAttachedLine(this)
            } else {
                let foundWidget: Widget | null = null
                for (const w of widgetLayer.children) {
                    if (
                        w instanceof Widget &&
                        w.uuid === this._tailBinding.id
                    ) {
                        foundWidget = w
                        break
                    }
                }

                if (foundWidget) {
                    this.tailBindingWidget = foundWidget
                    foundWidget.addAttachedLine(this)
                }
            }
        }
    }

    updatePointFromBinding(end: 'head' | 'tail') {
        const binding = end === 'head' ? this._headBinding : this._tailBinding
        const widget =
            end === 'head' ? this.headBindingWidget : this.tailBindingWidget

        if (!binding || !widget) return

        const absPos = widget.getPointFromRelative(binding.rx, binding.ry)
        const absolutePoints = [...this.absolutePoints] as [number, number][]

        if (end === 'head') {
            absolutePoints[absolutePoints.length - 1] = [absPos.x, absPos.y]
        } else {
            absolutePoints[0] = [absPos.x, absPos.y]
        }

        this.updateFromAbsolutePoints(absolutePoints)
    }

    get strokeColor() {
        return this._strokeColor
    }

    get strokeWidth() {
        return this._strokeWidth
    }

    get hasHeadArrow() {
        return this._hasHeadArrow
    }

    get hasTailArrow() {
        return this._hasTailArrow
    }

    get borderStyle() {
        return this._borderStyle
    }

    get headBinding() {
        return this._headBinding
    }

    set headBinding(binding: LineBinding | null) {
        this._headBinding = binding
    }

    get tailBinding() {
        return this._tailBinding
    }

    set tailBinding(binding: LineBinding | null) {
        this._tailBinding = binding
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
