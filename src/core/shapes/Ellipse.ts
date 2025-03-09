import {Shape, ShapeProps} from "@/core/shapes/Shape.ts";
import {Canvas as SkiaCanvas} from "canvaskit-wasm";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";

export class Ellipse extends Shape {
    constructor(props: ShapeProps) {
        super('ellipse', props)
    }

    renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx

        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);

        const ellipse = canvasKit.LTRBRect(
            0,
            0,
            this._width,
            this._height
        )

        const strokeHalf = 1
        const strokeEllipse = canvasKit.LTRBRect(
            0 + strokeHalf,
            0 + strokeHalf,
            this.width - strokeHalf,
            this._height - strokeHalf
        )

        // draw fill
        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(this._fillColor.r, this._fillColor.g, this._fillColor.b, this._fillColor.a)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);

        ctx.drawOval(ellipse, paint)

        // draw stroke
        const strokeColor = canvasKit.Color(this._strokeColor.r, this._strokeColor.g, this._strokeColor.b, this._strokeColor.a)
        paint.setColor(strokeColor);
        paint.setStyle(canvasKit.PaintStyle.Stroke);
        paint.setStrokeWidth(2)
        ctx.drawOval(strokeEllipse, paint)

    }
}