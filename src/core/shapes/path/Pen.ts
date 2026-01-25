import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Engine } from '@/core/engine/Engine'
import { Path, PathProps, PathProperties } from '@/core/shapes/path/Path'
import { RGBA } from '@/core/shapes/Color'
import { WsWidget } from '@/types/Websocket'
import { getSvgPathFromStroke, reconstructPathFromPoints } from './pathUtils'
import getStroke from 'perfect-freehand'
import { PathType, WidgetType } from '@/core/constants.ts'

export class Pen extends Path {
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

    protected renderContent(renderContext: RenderContext): void {
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        paint.setStrokeWidth((this._properties.strokeWidth as number) || 2)
        const color = canvasKit.Color(
            (this._properties.color as RGBA).r,
            (this._properties.color as RGBA).g,
            (this._properties.color as RGBA).b,
            (this._properties.color as RGBA).a,
        )
        paint.setColor(color)

        renderContext.ctx.drawPath(this._path, paint)
        paint.delete()
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
                this.changeThickness(props.strokeWidth)
            }
        }
    }

    changeThickness(newThickness: number): boolean {
        this._properties.strokeWidth = newThickness

        // we need to calculate new bounds since changing thickness can change
        // the bounds of the path
        const points = this._properties.points as number[][]
        const stroke = getStroke(points, {
            size: newThickness,
        })

        const svg = getSvgPathFromStroke(stroke)
        const pathFromSvg = canvasKit.Path.MakeFromSVGString(svg)!

        const newBounds = pathFromSvg.getBounds()
        const transformMatrix = canvasKit.Matrix.translated(
            -newBounds[0],
            -newBounds[1],
        )
        pathFromSvg.transform(transformMatrix)

        this.left = newBounds[0]
        this.top = newBounds[1]
        this.width = newBounds[2] - newBounds[0]
        this.height = newBounds[3] - newBounds[1]

        this.replacePath(pathFromSvg!, points)

        return true
    }
}
