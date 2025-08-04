import {
    Path as CkPath,
    TextAlign as CkTextAlign,
    Paragraph as CkParagraph,
} from 'canvaskit-wasm'
import { Widget, WidgetProps } from '@/core/shapes/Widget.ts'
import { RGBA } from '@/core/shapes/Color.ts'
import { canvasKit, fontManager, RenderContext } from '@/core/canvas/Canvas.ts'
import { CANVAS_COLORS } from '@/helpers/Constant.ts'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'

export interface ShapeTextProps extends WidgetProps {
    properties: ShapeTextProperties
}

export interface ShapeTextProperties {
    text: string
    color?: RGBA
    fontSize: number
    textAlign?: TEXT_ALIGN
    lineHeight?: number
}

/**
 * ShapeText is for texts in Shapes like Rect, Ellipse, Triangle, or sticky note.
 * Note: this is not an interactive class. And my desire is not to save this in
 * DB, since this can be generated automatically when the parent shape is generated,
 * we just need to save extra props for the parent shape.
 */
export class ShapeText extends Widget {
    private _text: string
    private _renderingText: string
    private _color: RGBA
    private _fontSize: number
    private _paragraph: CkParagraph
    private _shouldRender = true
    private _lineHeight: number
    private _isTextClipped: boolean
    private _clipPath: CkPath | null = null
    private _textAlign: TEXT_ALIGN

    constructor(props: ShapeTextProps) {
        super('shapeText', props)
        this._text = props.properties.text
        this._color = props.properties.color
            ? props.properties.color
            : CANVAS_COLORS.BLACK
        this._fontSize = props.properties.fontSize
        this._lineHeight = props.properties.lineHeight || 1.4
        this._textAlign = props.properties.textAlign
            ? props.properties.textAlign
            : 'center'

        this.createOrUpdateParagraph()
    }

    private getParagraphStyle() {
        const color = this.getColor()
        return new canvasKit.ParagraphStyle({
            textStyle: {
                color: canvasKit.Color(color.r, color.g, color.b, color.a),
                fontFamilies: ['Open-Sans'],
                fontSize: this._fontSize,
                heightMultiplier: this._lineHeight,
            },
            textAlign: this.getTextAlign(),
        })
    }

    private getTextAlign(): CkTextAlign {
        if (this._textAlign === 'left') {
            return canvasKit.TextAlign.Left
        }
        if (this._textAlign === 'right') {
            return canvasKit.TextAlign.Right
        }
        return canvasKit.TextAlign.Center
    }

    private getColor(): RGBA {
        return this._color
    }

    /**
     * ShapeText does not render the text completely if the text overflows the shape.
     * Instead, it renders N+1 lines that do not overflow.
     * +1 from N+1 is for indicating that the text overflows the shape.
     * So it says there is rest of this text. To see it, width, height of the parent shape
     * must be changed.
     */
    private calcRenderingText(): [string, boolean] {
        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )
        builder.addText(this._text)
        const paragraph = builder.build()
        paragraph.layout(this.width)

        // if text does not overflow, no need to calc it
        if (paragraph.getHeight() <= this._height) {
            return [this._text, false]
        }

        let lineHeights = 0
        let endIndex = this._text.length - 1
        const totalLines = paragraph.getNumberOfLines()

        for (let i = 0; i < totalLines; i++) {
            const metrics = paragraph.getLineMetricsAt(i)
            lineHeights += metrics?.height ? metrics.height : 0

            if (lineHeights > this._height) {
                endIndex = metrics?.endIndex
                    ? metrics.endIndex
                    : this._text.length - 1
                break
            }
        }

        return [this._text.substring(0, endIndex), true]
    }

    createOrUpdateParagraph(): CkParagraph {
        // ASI...
        ;[this._renderingText, this._isTextClipped] = this.calcRenderingText()

        // add clip path
        if (this._isTextClipped) {
            this._clipPath = new canvasKit.Path()
            const clipRect = canvasKit.LTRBRect(0, 0, this._width, this._height)
            this._clipPath.addRect(clipRect)
        }

        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )
        if (this._paragraph) {
            this._paragraph.delete()
        }
        builder.addText(this._renderingText)
        this._paragraph = builder.build()
        this._paragraph.layout(this.width)
        return this._paragraph
    }

    renderContent(renderContext: RenderContext) {
        if (!this._shouldRender && !this._renderingText.length) {
            return
        }

        const ctx = renderContext.ctx

        const textHeight = this._paragraph.getHeight()
        const consideringHeight =
            textHeight < this._height ? textHeight : this._height

        ctx.save()

        // if text overflows the height, add clip path
        if (this._isTextClipped && this._clipPath) {
            ctx.clipPath(this._clipPath, canvasKit.ClipOp.Intersect, false)
        }

        // center the text
        ctx.translate(0, Math.abs(consideringHeight - this._height) / 2)

        // render text
        ctx.drawParagraph(this._paragraph, 0, 0)
        ctx.restore()
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

    get fontSize(): number {
        return this._fontSize
    }

    get lineHeight(): number {
        return this._lineHeight
    }

    get isTextClipped(): boolean {
        return this._isTextClipped
    }
}
