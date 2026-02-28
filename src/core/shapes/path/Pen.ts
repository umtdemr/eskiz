import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Engine } from '@/core/engine/Engine'
import { Path, PathProps, PathProperties } from '@/core/shapes/path/Path'
import { RGBA } from '@/core/shapes/Color'
import { WsWidget } from '@/types/Websocket'
import { getSvgPathFromStroke, reconstructPathFromPoints } from './pathUtils'
import getStroke from 'perfect-freehand'
import { PathType, WidgetType } from '@/core/constants.ts'
import { Paint } from 'canvaskit-wasm'

export class Pen extends Path {
    private _paint: Paint | null = null

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

        renderContext.ctx.drawPath(this._path, paint)
    }

    destroy() {
        this._paint?.delete()
        this._paint = null
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
            },
            engine,
        )
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

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
        this.width = newBounds[2] - newBounds[0]
        this.height = newBounds[3] - newBounds[1]

        this.replacePath(pathFromSvg, points)

        return true
    }
}
