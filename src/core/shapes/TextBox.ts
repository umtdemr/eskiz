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
    fontSize: number
    isPlaceholder?: boolean
    lineHeight?: number
}

export class TextBox extends Widget {
    private _text: string
    private _color: RGBA
    private _fontSize: number
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
        this._fontSize = props.properties.fontSize
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
        return new canvasKit.ParagraphStyle({
            textStyle: {
                color: canvasKit.Color(color.r, color.g, color.b, color.a),
                fontFamilies: ['Open-Sans'],
                fontSize: this._fontSize,
                heightMultiplier: this._lineHeight,
            },
            textAlign: canvasKit.TextAlign.Left,
        })
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

    get fontSize(): number {
        return this._fontSize
    }

    get lineHeight(): number {
        return this._lineHeight
    }
}
