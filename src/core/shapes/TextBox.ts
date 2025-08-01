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
}

export class TextBox extends Widget {
    private _text: string
    private _color: RGBA
    private _fontSize: number
    private _paragraph: Paragraph
    private _isPlaceholder: boolean

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

        this.createOrUpdateParagraph()
        this._interactive = true
    }

    createOrUpdateParagraph(): Paragraph {
        const builder = canvasKit.ParagraphBuilder.Make(
            this.getParagraphStyle(),
            fontManager,
        )
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
                textBaseline: canvasKit.TextBaseline.Ideographic,
            },
            textAlign: canvasKit.TextAlign.Left,
        })
    }

    private getColor(): RGBA {
        if (this._isPlaceholder) {
            return CANVAS_COLORS.PURPLE
        }
        return this._color
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx
        ctx.drawParagraph(this._paragraph, 0, 0)
    }
}
