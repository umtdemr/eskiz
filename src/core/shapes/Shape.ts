import { RGBA } from '@/core/shapes/Color.ts'
import {
    BorderStyle,
    CANVAS_COLORS,
    DEFAULT_SHAPE_THICKNESS,
    FontStyleType,
} from '@/helpers/Constant.ts'
import { Widget, WidgetJson, WidgetProps } from '@/core/shapes/Widget.ts'
import { WsWidget } from '@/types/Websocket.ts'
import {
    ShapeText,
    ShapeTextConstructProps,
} from '@/core/shapes/text/ShapeText'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'
import { TextOp } from '../textEditor/TextEditor'
import {
    ShapeType as ShapeTypeConst,
    TextAlign,
    WidgetType,
} from '@/core/constants.ts'

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

export type ShapeType = typeof ShapeTypeConst[keyof typeof ShapeTypeConst]

const initialTextProps: ShapeTextConstructProps = {
    text: '',
    fontSize: 14,
    lineHeight: 1.4,
    textAlign: TextAlign.CENTER,
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
            widget_type: WidgetType.SHAPE,
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

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

        if (json.properties?.textProperties) {
            const textProps = json.properties
                .textProperties as ShapeTextConstructProps
            this._textProperties = {
                ...this._textProperties,
                ...textProps,
            }

            if (this._text) {
                if (textProps.text !== undefined && textProps.textOps) {
                    this._text.setTextOps(textProps.text, textProps.textOps)
                }
                if (textProps.fontSize !== undefined) {
                    this._text.changeFontSize(textProps.fontSize)
                }
                if (textProps.textAlign !== undefined) {
                    this._text.changeTextAlign(textProps.textAlign)
                }
            } else if (textProps.text) {
                this.createTextObject()
            }
        }

        if ((json.width || json.height) && this._text) {
            const bounds = this.calcTextBounds()
            this._text.left = bounds.x
            this._text.top = bounds.y
            this._text.width = bounds.width
            this._text.height = bounds.height
            this._text.createOrUpdateParagraph()
        }
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

    updateText(text: string, textOps: TextOp[]) {
        if (!this._text) return
        this._text.setTextOps(text, textOps)
        this._textProperties.text = text
        this._textProperties.textOps = textOps
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

    canChangeTextColor(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeTextColor(newColor: string): boolean {
        if (!this._text) return false
        this._text.changeColor(newColor)
        this._textProperties.textOps = this._text.textOps
        return true
    }

    canChangeHighlightColor(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeHighlightColor(newColor: string): boolean {
        if (!this._text) return false
        this._text.changeBackgroundColor(newColor)
        // TODO: this is annoying. we can populate JSON from the ShapeText directly.
        this._textProperties.textOps = this._text.textOps
        return true
    }

    canChangeTextAlign(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeTextAlign(newAlign: TEXT_ALIGN): boolean {
        if (!this._text) return false
        if (this._textProperties.textAlign === newAlign) return false
        this._textProperties.textAlign = newAlign
        this._text.changeTextAlign(newAlign)
        return true
    }

    canChangeFontSize(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeFontSize(newSize: number): boolean {
        if (!this._text) return false
        if (this._textProperties.fontSize === newSize) return false
        this._textProperties.fontSize = newSize
        this._text.changeFontSize(newSize)
        return true
    }

    canChangeFontStyle(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeFontStyle(style: FontStyleType, value: boolean): boolean {
        if (!this._text) return false

        const textOps = this._textProperties.textOps || []
        const updatedOps = textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                [style]: value,
            },
        }))

        this._textProperties.textOps = updatedOps
        this._text.setTextOps(this._textProperties.text, updatedOps)
        return true
    }

    // check if a font style is currently applied
    hasFontStyle(style: FontStyleType): boolean {
        const textOps = this._textProperties?.textOps || []
        if (!textOps.length) return false
        return textOps.some((op) => op.attributes[style] === true)
    }

    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        const resized = super.resize(opt)

        // if resized, update text bounding
        if (resized && this._text) {
            const bounds = this.calcTextBounds()
            this._text.resize({
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
            })
        }

        return resized
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
