import { Widget, WidgetProps } from '@/core/shapes/Widget.ts'
import { Engine } from '@/core/engine/Engine'
import { Paragraph as CkParagraph, Paint } from 'canvaskit-wasm'
import { canvasKit, fontManager, RenderContext } from '@/core/canvas/Canvas.ts'
import { createTextOpsFromString, TextOp } from '@/core/textEditor/TextEditor'
import { FontStyleType } from '@/helpers/Constant'
import { WsWidget } from '@/types/Websocket.ts'
import { RGBA } from '../Color'
import { TextAlign, TextType, WidgetType } from '@/core/constants.ts'

export interface TextBoxProps extends Omit<WidgetProps, 'height'> {
    properties: TextBoxProperties
}

export interface TextBoxProperties {
    text: string
    textOps?: TextOp[]
    fontSize: number
    textAlign?: TEXT_ALIGN
    isPlaceholder?: boolean
    lineHeight?: number
    fillColor?: RGBA
}

export type TEXT_ALIGN = (typeof TextAlign)[keyof typeof TextAlign]

export const TEXTBOX_MAX_CHARS = 3000

export class TextBox extends Widget {
    private _text: string
    private _textOps: TextOp[]
    private _fontSize: number
    private _textAlign: TEXT_ALIGN
    private _paragraph: CkParagraph
    private _isPlaceholder: boolean
    private _shouldRender = true
    private _lineHeight: number
    private _fillColor: null | RGBA
    private _fillPaint: Paint | null = null

    constructor(props: TextBoxProps, engine: Engine) {
        super(WidgetType.TEXTBOX, props, engine)
        this._text = props.properties.text
        if (!props.properties.textOps) {
            this._textOps = createTextOpsFromString(this._text)
        } else {
            this._textOps = props.properties.textOps
        }
        this._fontSize = props.properties.fontSize
        this._textAlign = props.properties.textAlign || TextAlign.LEFT
        this._isPlaceholder =
            props.properties.isPlaceholder !== undefined
                ? props.properties.isPlaceholder
                : false
        this._fillColor = props.properties.fillColor
            ? props.properties.fillColor
            : null
        this._lineHeight = props.properties.lineHeight || 1.4

        this.createOrUpdateParagraph()
        this._interactive = true
    }

    private ensureFillPaint(): Paint {
        if (!this._fillPaint) {
            this._fillPaint = new canvasKit.Paint()
            this._fillPaint.setStyle(canvasKit.PaintStyle.Fill)
        }
        return this._fillPaint
    }

    private getOpParagraph(): CkParagraph {
        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )

        for (let index = 0; index < this._textOps.length; index++) {
            const op = this._textOps[index]

            if (!op.text) continue
            const text =
                index === this._textOps.length - 1
                    ? op.text.lastIndexOf('\n') !== -1
                        ? op.text.substring(0, op.text.lastIndexOf('\n'))
                        : op.text
                    : op.text

            const color = op.attributes?.color
                ? canvasKit.parseColorString(op.attributes.color as string)
                : canvasKit.Color(0, 0, 0, 1)
            const style = new canvasKit.TextStyle({
                color,
                fontFamilies: ['Open-Sans'],
                fontSize: this._fontSize,
                heightMultiplier: this._lineHeight,
                fontStyle: {
                    weight: op.attributes?.bold
                        ? canvasKit.FontWeight.ExtraBold
                        : canvasKit.FontWeight.Normal,
                    slant: op.attributes?.italic
                        ? canvasKit.FontSlant.Italic
                        : canvasKit.FontSlant.Upright,
                },
                decoration:
                    (op.attributes?.underline ? 1 : 0) |
                    (op.attributes?.strike ? 4 : 0),
                decorationThickness: 3,
                decorationStyle: canvasKit.DecorationStyle.Solid,
                decorationColor: color, // same as text color
            })

            if (op.attributes.background) {
                style.backgroundColor = canvasKit.parseColorString(
                    op.attributes.background as string,
                )
            }

            builder.pushStyle(style)
            builder.addText(text)
            builder.pop()
        }

        const paragraph = builder.build()
        paragraph.layout(this.width)
        return paragraph
    }

    createOrUpdateParagraph(): CkParagraph {
        if (this._paragraph && !this._paragraph.isDeleted()) {
            this._paragraph.delete()
        }
        this._paragraph = this.getOpParagraph()
        this.height = this._paragraph.getHeight()
        return this._paragraph
    }

    getMinWidth(): number {
        return Math.max(10, this._fontSize)
    }

    private getParagraphStyle() {
        return new canvasKit.ParagraphStyle({
            textStyle: {
                fontFamilies: ['Open-Sans'],
                heightMultiplier: this._lineHeight,
            },
            textAlign: this.getTextAlign(),
            // maybe later we can add maxLines and ellipsis here
        })
    }

    private getTextAlign() {
        if (this._textAlign === TextAlign.CENTER) {
            return canvasKit.TextAlign.Center
        } else if (this._textAlign === TextAlign.RIGHT) {
            return canvasKit.TextAlign.Right
        }
        return canvasKit.TextAlign.Left
    }

    renderContent(renderContext: RenderContext) {
        if (!this._shouldRender) {
            return
        }
        if (this._paragraph?.isDeleted()) {
            this.createOrUpdateParagraph()
        }
        const ctx = renderContext.ctx

        if (this._fillColor && this._fillColor.a > 0) {
            const paint = this.ensureFillPaint()
            paint.setColor(
                canvasKit.Color(
                    this._fillColor.r,
                    this._fillColor.g,
                    this._fillColor.b,
                    this._fillColor.a,
                ),
            )
            ctx.drawRect(
                canvasKit.XYWHRect(0, 0, this.width, this.height),
                paint,
            )
        }

        ctx.drawParagraph(this._paragraph, 0, 0)
    }

    destroy() {
        this._fillPaint?.delete()
        this._fillPaint = null
        this._paragraph?.delete()
        super.destroy()
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

        if (json.properties) {
            const props = json.properties as Partial<TextBoxProperties>

            if (props.text !== undefined && props.textOps) {
                this.setTextOps(props.text, props.textOps)
            }
            if (props.fontSize !== undefined) {
                this.changeFontSize(props.fontSize)
            }
            if (props.textAlign !== undefined) {
                this.changeTextAlign(props.textAlign)
            }
            if (props.lineHeight !== undefined) {
                this._lineHeight = props.lineHeight
                this.createOrUpdateParagraph()
            }
            if (props.fillColor !== undefined) {
                this._fillColor = props.fillColor
            }
        }
    }

    setTextOps(text: string, ops: TextOp[]) {
        // enforce character limit
        const trimmed = text.replace(/\n$/, '')
        if (trimmed.length > TEXTBOX_MAX_CHARS) return

        this._text = text
        this._textOps = ops
        this.createOrUpdateParagraph()
    }

    setText(text: string) {
        this._text = text
        this._textOps = createTextOpsFromString(this._text)
        this.createOrUpdateParagraph()
    }

    hideText() {
        this._shouldRender = false
    }

    showText() {
        this._shouldRender = true
    }

    canChangeBgColor(): boolean {
        return true
    }

    changeBgColor(newColor: RGBA): boolean {
        this._fillColor = newColor
        return true
    }

    canChangeTextColor(): boolean {
        return true
    }

    changeTextColor(newColor: string): boolean {
        this._textOps = this._textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                color: newColor,
            },
        }))
        this.createOrUpdateParagraph()
        return true
    }

    canChangeHighlightColor(): boolean {
        return true
    }

    changeHighlightColor(newColor: string): boolean {
        this._textOps = this._textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                background: newColor,
            },
        }))
        this.createOrUpdateParagraph()
        return true
    }

    canChangeTextAlign(): boolean {
        return true
    }

    changeTextAlign(newAlign: TEXT_ALIGN): boolean {
        if (this._textAlign === newAlign) return false
        this._textAlign = newAlign
        this.createOrUpdateParagraph()
        return true
    }

    canChangeFontSize(): boolean {
        return true
    }

    changeFontSize(newSize: number): boolean {
        if (this._fontSize === newSize) return false
        this._fontSize = newSize
        this.createOrUpdateParagraph()
        return true
    }

    canChangeFontStyle(): boolean {
        return true
    }

    changeFontStyle(style: FontStyleType, value: boolean): boolean {
        // update all textOps with the new style
        const updatedOps = this._textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                [style]: value,
            },
        }))

        this._textOps = updatedOps
        this.createOrUpdateParagraph()
        return true
    }

    // check if a font style is currently applied
    hasFontStyle(style: FontStyleType): boolean {
        if (!this._textOps.length) return false
        return this._textOps.some((op) => op.attributes[style] === true)
    }

    get fontSize(): number {
        return this._fontSize
    }

    get lineHeight(): number {
        return this._lineHeight
    }

    get textStr(): string {
        return this._text
    }

    get textPropsJson(): TextBoxProperties {
        return {
            text: this._text,
            textOps: this._textOps,
            fontSize: this._fontSize,
            textAlign: this._textAlign,
            lineHeight: this._lineHeight,
        }
    }

    get properties() {
        return {
            text: this._text,
            textOps: this._textOps,
            fontSize: this._fontSize,
            textAlign: this._textAlign,
            lineHeight: this._lineHeight,
            ...(this._fillColor && {
                fillColor: this._fillColor,
            }),
        }
    }

    toJson() {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: WidgetType.TEXTBOX,
            sub_type: TextType.TEXTBOX,
            properties: this.properties,
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
            ...(this._parent_widget_id && {
                parent_widget_id: this._parent_widget_id,
            }),
        }
    }

    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        super.resize(opt)
        this.createOrUpdateParagraph()
        return true
    }

    static loadFromJson(json: WsWidget, engine: Engine): TextBox {
        const properties = json.properties as unknown as TextBoxProperties
        return new TextBox(
            {
                x: json.x,
                y: json.y,
                width: json.width,
                properties,
                uuid: json.uuid,
                z_index: json.z_index,
                parent_widget_id: json.parent_widget_id,
                is_locked: json.is_locked,
            },
            engine,
        )
    }
}
