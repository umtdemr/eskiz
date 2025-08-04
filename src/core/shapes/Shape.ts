import { RGBA } from '@/core/shapes/Color.ts'
import { CANVAS_COLORS } from '@/helpers/Constant.ts'
import { Widget, WidgetJson, WidgetProps } from '@/core/shapes/Widget.ts'
import { WsWidget } from '@/types/Websocket.ts'

export interface ShapeProps extends WidgetProps {
    properties: ShapeProperties
}

export interface ShapeProperties {
    strokeColor?: RGBA
    fillColor?: RGBA
}

export type ShapeType = 'rectangle' | 'triangle' | 'ellipse'

export abstract class Shape extends Widget {
    private _shapeType: ShapeType

    protected constructor(type: ShapeType, props: ShapeProps) {
        super('shape', props)
        this._shapeType = type
        this._properties = { ...props.properties }
        this._properties.strokeColor = this._properties?.strokeColor
            ? props.properties.strokeColor
            : CANVAS_COLORS.BLACK
        this._properties.fillColor = this._properties?.fillColor
            ? props.properties.fillColor
            : CANVAS_COLORS.TRANSPARENT
        this._interactive = true
    }

    protected generateJson(): WidgetJson {
        const data: WidgetJson = {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!, // todo: force uuid be to there,
            widget_type: 'shape',
            sub_type: this._shapeType,
            properties: {
                ...this._properties,
            },
        }

        if (this._parent_widget_id) {
            data.parent_widget_id = this._parent_widget_id
        }

        return data
    }

    static loadFromJson(json: WsWidget): Shape {
        throw new Error(`Shape (${json.sub_type}) be implemented by subclass`)
    }

    get shapeType(): ShapeType {
        return this._shapeType
    }

    /**
     * Returns bbox of where the text can be rendered?
     * TODO: implement it for ellipse and triangle too
     */
    abstract calcTextBounds(): {
        x: number
        y: number
        width: number
        height: number
    }
}
