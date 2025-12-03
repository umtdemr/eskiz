import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Path, PathProps, PathProperties } from '@/core/shapes/path/Path'
import { RGBA } from '@/core/shapes/Color'
import { WsWidget } from '@/types/Websocket'
import { reconstructPathFromPoints } from './pathUtils'

export class Pen extends Path {
    constructor(props: PathProps) {
        super('pen', props)
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
            widget_type: 'path' as const,
            sub_type: 'pen' as const,
            properties: this.properties,
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
            ...(this._parent_widget_id && {
                parent_widget_id: this._parent_widget_id,
            }),
        }
    }

    static loadFromJson(json: WsWidget): Pen {
        const properties = json.properties as unknown as PathProperties
        return new Pen({
            x: json.x,
            y: json.y,
            width: json.width,
            height: json.height,
            properties,
            uuid: json.uuid,
            z_index: json.z_index,
            parent_widget_id: json.parent_widget_id,
            is_locked: json.is_locked,
        })
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
            }
        }
    }
}
