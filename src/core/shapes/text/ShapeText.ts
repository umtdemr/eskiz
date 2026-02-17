import {
    TextAlign as CkTextAlign,
    Paragraph as CkParagraph,
} from 'canvaskit-wasm'
import { Widget, WidgetProps } from '@/core/shapes/Widget.ts'
import { Engine } from '@/core/engine/Engine'
import { RGBA } from '@/core/shapes/Color.ts'
import { canvasKit, fontManager, RenderContext } from '@/core/canvas/Canvas.ts'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'
import { createTextOpsFromString, TextOp } from '@/core/textEditor/TextEditor'
import { TextAlign, WidgetType } from '@/core/constants.ts'

export interface ShapeTextProps extends WidgetProps {
    properties: ShapeTextConstructProps
}

export interface ShapeTextConstructProps {
    text: string
    fontSize: number
    textAlign: TEXT_ALIGN
    lineHeight: number
    textOps?: TextOp[]
}

/**
 * ShapeText is for texts in Shapes like Rect, Ellipse, Triangle, or sticky note.
 * Note: this is not an interactive class. And my desire is not to save this in
 * DB, since this can be generated automatically when the parent shape is generated,
 * we just need to save extra props for the parent shape.
 */
export class ShapeText extends Widget {
    private _text: string
    private _textOps: TextOp[] = []
    private _fontSize: number
    private _paragraph: CkParagraph
    private _shouldRender = true
    private _lineHeight: number
    private _textAlign: TEXT_ALIGN
    private _debug: boolean = false
    private _isTextClipped: boolean = false
    private _defaultTextColor: Float32Array | null = null

    constructor(props: ShapeTextProps, engine: Engine) {
        super(WidgetType.SHAPE_TEXT, props, engine)
        this._text = props.properties.text
        if (!props.properties.textOps) {
            this._textOps = createTextOpsFromString(this._text)
        } else {
            this._textOps = props.properties.textOps
        }
        this._fontSize = props.properties.fontSize
        this._lineHeight = props.properties.lineHeight
        this._textAlign = props.properties.textAlign

        this.createOrUpdateParagraph()
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

    private getTextAlign(): CkTextAlign {
        if (this._textAlign === TextAlign.LEFT) {
            return canvasKit.TextAlign.Left
        }
        if (this._textAlign === TextAlign.RIGHT) {
            return canvasKit.TextAlign.Right
        }
        return canvasKit.TextAlign.Center
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
                : (this._defaultTextColor ?? canvasKit.Color(0, 0, 0, 1))
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

    /**
     * measure the width of a specific word at the current font size.
     */
    private measureWordWidth(word: string): number {
        // todo: we can optimize this by caching the paragraph?
        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )
        const style = new canvasKit.TextStyle({
            color: canvasKit.Color(0, 0, 0, 1),
            fontFamilies: ['Open-Sans'],
            fontSize: this._fontSize,
            heightMultiplier: this._lineHeight,
        })
        builder.pushStyle(style)
        builder.addText(word)
        builder.pop()
        const para = builder.build()
        para.layout(Infinity) // layout with infinite width to get natural width
        const width = para.getMaxIntrinsicWidth()
        para.delete()
        return width
    }

    /**
     * get the longest word from the text content.
     */
    private getLongestWord(): string {
        // trim trailing whitespace/newlines to match how paragraph strips them
        const text = this._text.trim()
        if (!text) return ''
        const words = text.split(/\s+/).filter((w) => w.length > 0)
        return words.reduce(
            (longest, word) => (word.length > longest.length ? word : longest),
            '',
        )
    }

    createOrUpdateParagraph(): CkParagraph {
        if (this._paragraph) {
            this._paragraph.delete()
        }

        const paragraph = this.getOpParagraph()
        this._paragraph = paragraph
        const textHeight = paragraph.getHeight()
        this._isTextClipped = textHeight > this._height
        return this._paragraph
    }

    /**
     * Calculate the height the text would occupy at a given font size.
     * Used for auto font size calculation.
     */
    calculateHeightAtFontSize(fontSize: number): number {
        const originalFontSize = this._fontSize
        this._fontSize = fontSize
        const paragraph = this.getOpParagraph()
        const height = paragraph.getHeight()
        paragraph.delete()
        this._fontSize = originalFontSize
        return height
    }

    checkFitsAtFontSize(fontSize: number, maxHeight: number): boolean {
        const originalFontSize = this._fontSize
        this._fontSize = fontSize
        // todo: we can optimize this by caching the paragraph
        const paragraph = this.getOpParagraph()

        const height = paragraph.getHeight()

        // check height first
        if (height > maxHeight) {
            paragraph.delete()
            this._fontSize = originalFontSize
            return false
        }

        // check if longest word fits without breaking
        const longestWord = this.getLongestWord()
        if (longestWord && longestWord.length <= 16) {
            const wordWidth = this.measureWordWidth(longestWord)
            if (wordWidth > this._width) {
                paragraph.delete()
                this._fontSize = originalFontSize
                return false
            }
        }

        paragraph.delete()
        this._fontSize = originalFontSize
        return true
    }

    renderContent(renderContext: RenderContext) {
        if (!this._shouldRender || !this._text.length) {
            return
        }

        const ctx = renderContext.ctx

        // if debug is active, render background color
        if (this._debug) {
            const rect = canvasKit.LTRBRect(0, 0, this._width, this._height)
            const rectPaint = new canvasKit.Paint()
            rectPaint.setAntiAlias(true)
            rectPaint.setStyle(canvasKit.PaintStyle.Fill)
            rectPaint.setColor(canvasKit.Color(0, 255, 0, 0.3))
            ctx.drawRect(rect, rectPaint)
            rectPaint.delete()
        }

        const paragraph = this._paragraph

        ctx.save()

        // if clipped, apply clipping
        if (this._isTextClipped) {
            const clipPath = new canvasKit.Path()
            clipPath.addRect(
                canvasKit.LTRBRect(0, 0, this._width, this._height),
            )
            ctx.clipPath(clipPath, canvasKit.ClipOp.Intersect, true)
            clipPath.delete()
        }

        if (!this._isTextClipped) {
            const yOffset = Math.max(
                0,
                (this._height - paragraph.getHeight()) / 2,
            )
            ctx.translate(0, yOffset)
        }

        ctx.drawParagraph(paragraph, 0, 0)
        ctx.restore()
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

    changeColor(color: string) {
        if (!this._textOps?.length) return

        this._textOps = this._textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                color: color,
            },
        }))
        this.createOrUpdateParagraph()
    }

    setDefaultTextColor(color: Float32Array) {
        this._defaultTextColor = color
        this.createOrUpdateParagraph()
    }

    changeBackgroundColor(color: string) {
        this._textOps = this._textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                background: color,
            },
        }))
        this.createOrUpdateParagraph()
    }

    changeTextAlign(align: TEXT_ALIGN) {
        this._textAlign = align
        this.createOrUpdateParagraph()
    }

    changeFontSize(size: number) {
        this._fontSize = size
        this.createOrUpdateParagraph()
    }

    hideText() {
        this._shouldRender = false
    }

    showText() {
        this._shouldRender = true
    }

    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        this._x = opt.left!
        this._y = opt.top!
        this._width = opt.width!
        this._height = opt.height!
        this.createOrUpdateParagraph()
        return true
    }

    get fontSize(): number {
        return this._fontSize
    }

    get lineHeight(): number {
        return this._lineHeight
    }

    get text(): string {
        return this._text
    }

    get textOps(): TextOp[] {
        return this._textOps
    }
}
