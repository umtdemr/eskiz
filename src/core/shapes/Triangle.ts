import {Shape, ShapeProps} from "@/core/shapes/Shape.ts";
import {Canvas as SkiaCanvas} from "canvaskit-wasm";
import { canvasKit } from "@/core/canvas/Canvas";

export class Triangle extends Shape {
    constructor(props: ShapeProps) {
        super('triangle', props)
    }

    render(ctx: SkiaCanvas): void {
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        ctx.translate(this._x, this._y)
        const path = new canvasKit.Path()
        path.moveTo(-this.width / 2, this.height / 2)
        path.lineTo(0, -this.height / 2)
        path.lineTo(this.width / 2, this.height / 2)
        path.lineTo(-this.width / 2, this.height / 2)
        path.close()

        const strokeHalf = 1
        const pathStroke = new canvasKit.Path()
        pathStroke.moveTo(-this.width / 2 + strokeHalf, this.height / 2 - strokeHalf)
        pathStroke.lineTo(0, -this.height / 2 + strokeHalf)
        pathStroke.lineTo(this.width / 2 - strokeHalf, this.height / 2 - strokeHalf)
        pathStroke.lineTo(-this.width / 2 + strokeHalf, this.height / 2 - strokeHalf)
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