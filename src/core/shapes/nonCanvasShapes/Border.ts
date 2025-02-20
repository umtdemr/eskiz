import { Paint } from "canvaskit-wasm";
import { Widget, WidgetProps } from "../Widget";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";

export class Border extends Widget {
    private paint: Paint

    constructor(props: WidgetProps) {
        super('border', props)
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        this.paint.setColor(canvasKit.Color(29, 78, 216, .8))
    }

    protected renderContent(renderContext: RenderContext): void {
        const rect = canvasKit.XYWHRect(
            0,
            0,
            this.width,
            this.height,
        )

        this.paint.setStrokeWidth(2 / renderContext.scale)
        renderContext.ctx.drawRect(rect, this.paint)
    }
}