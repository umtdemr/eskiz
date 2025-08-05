import { RGBA } from '@/core/shapes/Color.ts'
import { CANVAS_COLORS } from '@/helpers/Constant.ts'
import { Widget, WidgetJson, WidgetProps } from '@/core/shapes/Widget.ts'
import { WsWidget } from '@/types/Websocket.ts'
import {
    ShapeText,
    ShapeTextConstructProps,
} from '@/core/shapes/text/ShapeText'

export interface ShapeProps extends WidgetProps {
    properties: ShapeProperties
}

export interface ShapeProperties {
    strokeColor?: RGBA
    fillColor?: RGBA
    textProperties?: ShapeTextConstructProps
}

export type ShapeType = 'rectangle' | 'triangle' | 'ellipse'

export abstract class Shape extends Widget {
    private _shapeType: ShapeType
    protected _text: ShapeText | null
    protected _textProperties: ShapeTextConstructProps

    protected constructor(type: ShapeType, props: ShapeProps) {
        // TODO: construct shape text in here
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
        // TODO: generate text json (add a method in ShapeText)
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

    protected createTextObject() {
        const textProps: ShapeTextConstructProps = {
            text: '',
            color: CANVAS_COLORS.BLACK,
            fontSize: 14,
            lineHeight: 1.4,
            textAlign: 'center',
        }

        this._text = new ShapeText({
            ...this.calcTextBounds(),
            properties: {
                ...textProps,
            },
        })

        this.addChildren(this._text)
    }

    startEditingText() {
        if (!this._text) {
            this.createTextObject()
            this._text!.hideText()
            return
        }

        this._text.hideText()
    }

    finishEditingText() {
        if (!this._text) return
        this._text!.hideText()
    }

    updateText(text: string) {
        if (!this._text) return
        this._text.setText(text)
    }
}
