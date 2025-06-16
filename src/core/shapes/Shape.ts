import {RGBA} from "@/core/shapes/Color.ts";
import {CANVAS_COLORS} from "@/helpers/Constant.ts";
import {Widget, WidgetProps} from "@/core/shapes/Widget.ts";
import {WsWidget} from "@/types/Websocket.ts";


export interface ShapeProps extends WidgetProps {
    properties: ShapeProperties
}

export interface ShapeProperties {
    strokeColor?: RGBA
    fillColor?: RGBA
}

export type ShapeType = 'rectangle' | 'triangle' | 'ellipse'

export abstract class Shape extends Widget {
    protected _strokeColor: RGBA
    protected _fillColor: RGBA
    private _shapeType: ShapeType
    
    protected constructor(type: ShapeType, props: ShapeProps) {
        super('shape', props)
        this._shapeType = type
        this._strokeColor = props.properties?.strokeColor ? props.properties.strokeColor : CANVAS_COLORS.BLACK
        this._fillColor = props.properties?.fillColor ? props.properties.fillColor : CANVAS_COLORS.TRANSPARENT
        this._interactive = true
    }

    static loadFromJson(json: WsWidget): Shape {
        throw new Error(`Shape (${json.sub_type}) be implemented by subclass`);
    }

    get shapeType(): ShapeType {
        return this._shapeType
    }
}