import { RGBA } from '@/core/shapes/Color.ts'
import {
    BorderStyle,
    CANVAS_COLORS,
    DEFAULT_SHAPE_THICKNESS,
} from '@/helpers/Constant.ts'
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
    borderStyle?: BorderStyle
    strokeWidth?: number
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
        this._properties.borderStyle = this._properties?.borderStyle
            ? props.properties.borderStyle
            : BorderStyle.SOLID
        this._properties.strokeWidth = this._properties?.strokeWidth
            ? props.properties.strokeWidth
            : DEFAULT_SHAPE_THICKNESS
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
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
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

    canChangeBgColor(): boolean {
        return true
    }

    changeBgColor(newColor: RGBA): boolean {
        this._properties.fillColor = newColor
        return true
    }

    canChangeBorderColor(): boolean {
        return true
    }

    changeBorderColor(newColor: RGBA): boolean {
        this._properties.strokeColor = newColor
        return true
    }

    canChangeBorderStyle(): boolean {
        return true
    }

    changeBorderStyle(newStyle: BorderStyle): boolean {
        if (this._properties.borderStyle === newStyle) return false
        this._properties.borderStyle = newStyle
        return true
    }

    canChangeThickness(): boolean {
        return true
    }

    changeThickness(val: number): boolean {
        if (this._properties.strokeWidth === val) return false
        this._properties.strokeWidth = val
        return true
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
