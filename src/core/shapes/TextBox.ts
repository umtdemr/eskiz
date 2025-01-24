import {Widget, WidgetProps} from "@/core/shapes/Widget.ts";
import {CanvasKit, Canvas as SkiaCanvas, Paragraph} from "canvaskit-wasm";
import {RGBA} from "@/core/shapes/Color.ts";
import {canvasKit, fontManager} from "@/core/canvas/Canvas.ts";
import {CANVAS_COLORS} from "@/helpers/Constant.ts";

export interface TextBoxProps extends Omit<WidgetProps, 'height'> {
    text: string
    color?: RGBA
    fontSize: number
}

export class TextBox extends Widget {
    _text: string
    _color: RGBA
    _fontSize: number
    _paragraph: Paragraph
    
    constructor(props: TextBoxProps) {
        super('text', props);
        this._text = props.text
        this._color = props.color ? props.color : CANVAS_COLORS.BLACK
        this._fontSize = 14
        
        this.createOrUpdateParagraph()
    }
    
    createOrUpdateParagraph(): Paragraph {
        const builder = new canvasKit.ParagraphBuilder.Make(this.getParagraphStyle(), fontManager)
        builder.addText(this._text)
        this._paragraph = builder.build()
        this._paragraph.layout(this.width)
        this.height = this._paragraph.getHeight()
        return this._paragraph
    }
    
    private getParagraphStyle() {
        return new canvasKit.ParagraphStyle({
            textStyle: {
                color: canvasKit.Color(this._color.r, this._color.g, this._color.b),
                fontFamilies: ['Open-Sans'],
                fontSize: this._fontSize,
            },
            textAlign: canvasKit.TextAlign.Left,
        })
    }
    

    render(canvasKit: CanvasKit, ctx: SkiaCanvas): void {
        ctx.translate(this._x, this._y)
        ctx.drawParagraph(this._paragraph, -this.width / 2, -this.height / 2)
    }

}