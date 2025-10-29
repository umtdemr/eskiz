import { Widget, WidgetProps } from '@/core/shapes/Widget.ts'
import { Paragraph } from 'canvaskit-wasm'
import { RGBA } from '@/core/shapes/Color.ts'
import { canvasKit, fontManager, RenderContext } from '@/core/canvas/Canvas.ts'
import { CANVAS_COLORS } from '@/helpers/Constant.ts'

export interface TextBoxProps extends Omit<WidgetProps, 'height'> {
    properties: TextBoxProperties
}

export interface TextBoxProperties {
    text: string
    color?: RGBA
    backgroundColor?: RGBA
    fontSize: number
    textAlign?: TEXT_ALIGN
    isPlaceholder?: boolean
    lineHeight?: number
}

export type TEXT_ALIGN = 'left' | 'center' | 'right'

export class TextBox extends Widget {
    private _text: string
    private _color: RGBA
    private _backgroundColor?: RGBA
    private _fontSize: number
    private _textAlign: TEXT_ALIGN
    private _paragraph: Paragraph
    private _isPlaceholder: boolean
    private _shouldRender = true
    private _lineHeight: number

    constructor(props: TextBoxProps) {
        super('text', props)
        this._text = props.properties.text
        this._color = props.properties.color
            ? props.properties.color
            : CANVAS_COLORS.BLACK
        this._backgroundColor = props.properties.backgroundColor
        this._fontSize = props.properties.fontSize
        this._textAlign = props.properties.textAlign || 'left'
        this._isPlaceholder =
            props.properties.isPlaceholder !== undefined
                ? props.properties.isPlaceholder
                : false
        this._lineHeight = props.properties.lineHeight || 1.4

        this.createOrUpdateParagraph()
        this._interactive = true
    }

    createOrUpdateParagraph(): Paragraph {
        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )
        if (this._paragraph) {
            this._paragraph.delete()
        }
        builder.addText(this._text)
        this._paragraph = builder.build()
        this._paragraph.layout(this.width)
        this.height = this._paragraph.getHeight()
        return this._paragraph
    }

    private getParagraphStyle() {
        const color = this.getColor()
        const style: any = {
            textStyle: {
                color: canvasKit.Color(color.r, color.g, color.b, color.a),
                fontFamilies: ['Open-Sans'],
                fontSize: this._fontSize,
                heightMultiplier: this._lineHeight,
            },
            textAlign: this.getTextAlign(),
        }

        // Add backgroundColor if it exists
        if (this._backgroundColor && this._backgroundColor.a > 0) {
            style.textStyle.backgroundColor = canvasKit.Color(
                this._backgroundColor.r,
                this._backgroundColor.g,
                this._backgroundColor.b,
                this._backgroundColor.a,
            )
        }

        return new canvasKit.ParagraphStyle(style)
    }

    private getTextAlign() {
        if (this._textAlign === 'center') {
            return canvasKit.TextAlign.Center
        } else if (this._textAlign === 'right') {
            return canvasKit.TextAlign.Right
        }
        return canvasKit.TextAlign.Left
    }

    private getColor(): RGBA {
        return this._color
    }

    renderContent(renderContext: RenderContext) {
        if (!this._shouldRender) {
            return
        }
        const ctx = renderContext.ctx
        ctx.drawParagraph(this._paragraph, 0, 0)
    }

    setText(text: string) {
        this._text = text
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

    canChangeTextColor(): boolean {
        return true
    }

    changeTextColor(newColor: RGBA): boolean {
        this._color = newColor
        this.createOrUpdateParagraph()
        return true
    }

    canChangeHighlightColor(): boolean {
        return true
    }

    changeHighlightColor(newColor: RGBA): boolean {
        this._backgroundColor = newColor
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
            color: this._color,
            backgroundColor: this._backgroundColor,
            fontSize: this._fontSize,
            textAlign: this._textAlign,
            lineHeight: this._lineHeight,
        }
    }

    // TODO: implement fully when saving in db
    get properties() {
        return {
            color: this._color,
            backgroundColor: this._backgroundColor,
            textAlign: this._textAlign,
        }
    }
}
