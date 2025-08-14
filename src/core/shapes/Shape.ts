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

const initialTextProps: ShapeTextConstructProps = {
    text: '',
    color: CANVAS_COLORS.BLACK,
    fontSize: 14,
    lineHeight: 1.4,
    textAlign: 'center',
}

export abstract class Shape extends Widget {
    private _shapeType: ShapeType
    protected _text: ShapeText | null
    protected _textProperties: ShapeTextConstructProps

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

        if (props.properties.textProperties?.text) {
            this._textProperties = props.properties.textProperties
            this.createTextObject()
        }
    }

    protected generateJson(): WidgetJson {
        const data: WidgetJson = {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: 'shape',
            sub_type: this._shapeType,
            properties: {
                ...this._properties,
                textProperties: this._textProperties,
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
     */
    abstract calcTextBounds(): {
        x: number
        y: number
        width: number
        height: number
    }

    protected createTextObject() {
        this._text = new ShapeText({
            ...this.calcTextBounds(),
            properties: {
                ...this._textProperties,
            },
        })

        this.addChildren(this._text)
    }

    startEditingText() {
        if (!this._text) {
            this._textProperties = initialTextProps
            this.createTextObject()
            this._text!.hideText()
            return
        }

        this._text.hideText()
    }

    finishEditingText() {
        if (!this._text) return
        this._text!.showText()
    }

    updateText(text: string) {
        if (!this._text) return
        this._text.setText(text)
        this._textProperties.text = text
    }

    get textStr(): string {
        if (this._text) {
            return this._text?.text
        }
        return ''
    }

    get textProperties(): ShapeTextConstructProps {
        return this._textProperties
    }
}
