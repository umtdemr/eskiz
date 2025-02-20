import {RGBA} from "@/core/shapes/Color.ts";
import {CANVAS_COLORS} from "@/helpers/Constant.ts";
import {Widget, WidgetProps} from "@/core/shapes/Widget.ts";

export interface ShapeProps extends WidgetProps {
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
        this._strokeColor = props.strokeColor ? props.strokeColor : CANVAS_COLORS.BLACK
        this._fillColor = props.fillColor ? props.fillColor : CANVAS_COLORS.TRANSPARENT 
        this._interactive = true
    }
}