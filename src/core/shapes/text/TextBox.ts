import { Widget, WidgetProps } from '@/core/shapes/Widget.ts'
import { Paragraph as CkParagraph } from 'canvaskit-wasm'
import { RGBA } from '@/core/shapes/Color.ts'
import { canvasKit, fontManager, RenderContext } from '@/core/canvas/Canvas.ts'
import { createTextOpsFromString, TextOp } from '@/core/textEditor/TextEditor'
import { FontStyleType } from '@/helpers/Constant'

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
}

export type TEXT_ALIGN = 'left' | 'center' | 'right'

export class TextBox extends Widget {
    private _text: string
    private _textOps: TextOp[]
    private _fontSize: number
    private _textAlign: TEXT_ALIGN
    private _paragraph: CkParagraph
    private _isPlaceholder: boolean
    private _shouldRender = true
    private _lineHeight: number

    constructor(props: TextBoxProps) {
        super('text', props)
        this._text = props.properties.text
        if (!props.properties.textOps) {
            this._textOps = createTextOpsFromString(this._text)
        } else {
            this._textOps = props.properties.textOps
        }
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
        if (this._paragraph) {
            this._paragraph.delete()
        }
        this._paragraph = this.getOpParagraph()
        this.height = this._paragraph.getHeight()
        return this._paragraph
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
        if (this._textAlign === 'center') {
            return canvasKit.TextAlign.Center
        } else if (this._textAlign === 'right') {
            return canvasKit.TextAlign.Right
        }
        return canvasKit.TextAlign.Left
    }

    renderContent(renderContext: RenderContext) {
        if (!this._shouldRender) {
            return
        }
        const ctx = renderContext.ctx
        ctx.drawParagraph(this._paragraph, 0, 0)
    }

    setTextOps(text: string, ops: TextOp[]) {
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

    // TODO: implement fully when saving in db
    get properties() {
        return {
            textAlign: this._textAlign,
            fontSize: this._fontSize,
            textOps: this._textOps,
        }
    }
}
