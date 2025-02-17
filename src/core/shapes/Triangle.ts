import {Shape, ShapeProps} from "@/core/shapes/Shape.ts";
import {Canvas as SkiaCanvas} from "canvaskit-wasm";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";

export class Triangle extends Shape {
    constructor(props: ShapeProps) {
        super('triangle', props)
    }

    renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        const path = new canvasKit.Path()
        path.moveTo(0, this.height)           // Bottom left
        path.lineTo(this.width / 2, 0)          // Top middle
        path.lineTo(this.width, this.height)  // Bottom right
        path.lineTo(0, this.height)           // Back to bottom left
        path.close()

        const strokeHalf = 1
        const pathStroke = new canvasKit.Path()
        pathStroke.moveTo(strokeHalf, this.height - strokeHalf)
        pathStroke.lineTo(this.width / 2, strokeHalf)
        pathStroke.lineTo(this.width - strokeHalf, this.height - strokeHalf)
        pathStroke.lineTo(strokeHalf, this.height - strokeHalf)
        pathStroke.close()
        
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(this._fillColor.r, this._fillColor.g, this._fillColor.b, this._fillColor.a)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill)
        ctx.drawPath(path, paint)

        paint.setStrokeWidth(2)
        const strokeColor = canvasKit.Color(this._strokeColor.r, this._strokeColor.g, this._strokeColor.b, this._strokeColor.a)
        paint.setColor(strokeColor);
        paint.setStyle(canvasKit.PaintStyle.Stroke);

        ctx.drawPath(pathStroke, paint)
    }
}