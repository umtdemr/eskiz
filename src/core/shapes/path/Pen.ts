import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Path as CkPath } from 'canvaskit-wasm'
import { Engine } from '@/core/engine/Engine'
import { Path, PathProps, PathProperties } from '@/core/shapes/path/Path'
import { RGBA } from '@/core/shapes/Color'
import { WsWidget } from '@/types/Websocket'
import { getSvgPathFromStroke, reconstructPathFromPoints } from './pathUtils'
import getStroke from 'perfect-freehand'
import { PathType, WidgetType } from '@/core/constants.ts'
import { Paint } from 'canvaskit-wasm'

const HIT_TOLERANCE = 6

export class Pen extends Path {
    private _paint: Paint | null = null
    private _scale: number = 1
    private _band: CkPath | null = null
    private _bandOf: CkPath | null = null
    private _bandWidth = 0
    protected _baseWidth: number = 0

    constructor(props: PathProps, engine: Engine) {
        super(PathType.PEN, props, engine)
        this._interactive = true

        if (props.properties.points && props.properties.points.length > 1) {
            const path = reconstructPathFromPoints(
                props.properties.points,
                props.properties.strokeWidth || 2,
            )
            if (path) {
                this._path = path
                const bounds = path.getBounds()
                this._baseWidth = bounds[2] - bounds[0]

                if (this._baseWidth > 0) {
                    this._scale = this._width / this._baseWidth
                }
            }
        }
    }

    private ensurePaint(): Paint {
        if (!this._paint) {
            this._paint = new canvasKit.Paint()
            this._paint.setAntiAlias(true)
            this._paint.setStyle(canvasKit.PaintStyle.Fill)
        }
        return this._paint
    }

    protected renderContent(renderContext: RenderContext): void {
        if (!this._path || this._path.isDeleted()) {
            const points = this._properties.points as number[][]
            if (points && points.length > 1) {
                const path = reconstructPathFromPoints(
                    points,
                    (this._properties.strokeWidth as number) || 2,
                )
                if (path) {
                    this._path = path
                }
            }
            if (!this._path) return
        }

        const paint = this.ensurePaint()
        paint.setStrokeWidth((this._properties.strokeWidth as number) || 2)
        const color = canvasKit.Color(
            (this._properties.color as RGBA).r,
            (this._properties.color as RGBA).g,
            (this._properties.color as RGBA).b,
            (this._properties.color as RGBA).a,
        )
        paint.setColor(color)

        renderContext.ctx.save()
        renderContext.ctx.scale(this._scale, this._scale)
        renderContext.ctx.drawPath(this._path, paint)
        renderContext.ctx.restore()
    }

    protected containsLocal(x: number, y: number): boolean {
        if (!this._path || this._path.isDeleted()) {
            return super.containsLocal(x, y)
        }

        const tolerance = HIT_TOLERANCE / (this._engine.canvas.zoom || 1)
        if (
            x < -tolerance ||
            y < -tolerance ||
            x > this._width + tolerance ||
            y > this._height + tolerance
        ) {
            return false
        }

        // the path keeps its drawn size, resize only scales it
        const px = x / this._scale
        const py = y / this._scale
        if (this._path.contains(px, py)) return true

        return this.hitBand((2 * tolerance) / this._scale).contains(px, py)
    }

    // outline widened so thin strokes are easy to hit, rebuilt when the path or zoom changes
    private hitBand(width: number): CkPath {
        if (
            !this._band ||
            this._bandOf !== this._path ||
            this._bandWidth !== width
        ) {
            this._band?.delete()
            this._band = this._path!.copy()
            this._band.stroke({ width })
            this._bandOf = this._path
            this._bandWidth = width
        }
        return this._band
    }

    replacePath(newPath: CkPath, newPoints: number[][]) {
        super.replacePath(newPath, newPoints)
        const bounds = newPath.getBounds()
        this._baseWidth = bounds[2] - bounds[0]
    }

    destroy() {
        this._paint?.delete()
        this._paint = null
        this._band?.delete()
        this._band = null
        this._bandOf = null
        super.destroy()
    }

    toJson() {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: WidgetType.PATH,
            sub_type: PathType.PEN,
            properties: this.properties,
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
            ...(this._parent_widget_id && {
                parent_widget_id: this._parent_widget_id,
            }),
            angle: this._angle,
        }
    }

    static loadFromJson(json: WsWidget, engine: Engine): Pen {
        const properties = json.properties as unknown as PathProperties
        return new Pen(
            {
                x: json.x,
                y: json.y,
                width: json.width,
                height: json.height,
                properties,
                uuid: json.uuid,
                z_index: json.z_index,
                parent_widget_id: json.parent_widget_id,
                is_locked: json.is_locked,
                angle: json.angle,
            },
            engine,
        )
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

        if (json.width !== undefined && this._baseWidth > 0) {
            this._scale = this._width / this._baseWidth
        }

        if (json.properties) {
            const props = json.properties as Partial<PathProperties>

            if (props.color !== undefined) {
                this._properties.color = props.color
            }
            if (props.strokeWidth !== undefined) {
                this._properties.strokeWidth = props.strokeWidth
                const { pathFromSvg } = this.rebuildPath(props.strokeWidth)
                this.replacePath(
                    pathFromSvg,
                    this._properties.points as number[][],
                )
            }
        }
    }

    private rebuildPath(thickness: number) {
        const points = this._properties.points as number[][]
        const stroke = getStroke(points, {
            size: thickness,
        })

        const svg = getSvgPathFromStroke(stroke)
        const pathFromSvg = canvasKit.Path.MakeFromSVGString(svg)!

        const newBounds = pathFromSvg.getBounds()
        const transformMatrix = canvasKit.Matrix.translated(
            -newBounds[0],
            -newBounds[1],
        )
        pathFromSvg.transform(transformMatrix)

        return { newBounds, pathFromSvg }
    }

    changeThickness(newThickness: number): boolean {
        const oldThickness = (this._properties.strokeWidth as number) || 2
        this._properties.strokeWidth = newThickness

        const points = this._properties.points as number[][]

        // calculate old bounds to find the positional delta
        const oldStroke = getStroke(points, { size: oldThickness })
        const oldSvg = getSvgPathFromStroke(oldStroke)
        const oldPathFromSvg = canvasKit.Path.MakeFromSVGString(oldSvg)!
        const oldBounds = oldPathFromSvg.getBounds()
        oldPathFromSvg.delete() // clean up since we only need bounds

        const dx = this.left - oldBounds[0]
        const dy = this.top - oldBounds[1]

        // we need to calculate new bounds since changing thickness can change
        // the bounds of the path
        const { newBounds, pathFromSvg } = this.rebuildPath(newThickness)

        this.left = newBounds[0] + dx
        this.top = newBounds[1] + dy
        this.width = (newBounds[2] - newBounds[0]) * this._scale
        this.height = (newBounds[3] - newBounds[1]) * this._scale

        this.replacePath(pathFromSvg, points)

        return true
    }

    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        const resized = super.resize(opt)

        const _baseWidth = this._baseWidth > 0 ? this._baseWidth : this._width
        if (resized) {
            this._scale = this._width / _baseWidth
        }

        return resized
    }

    get scale(): number {
        return this._scale
    }
}
