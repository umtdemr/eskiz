import {Shape, ShapeProps} from "@/core/shapes/Shape.ts";
import {CanvasKit, Canvas as SkiaCanvas} from "canvaskit-wasm";

export class Ellipse extends Shape {
    constructor(props: ShapeProps) {
        super('ellipse', props)
    }

    render(canvasKit: CanvasKit, ctx: SkiaCanvas): void {
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        ctx.translate(this._x, this._y)
        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);
        let ellipse = canvasKit.LTRBRect(
            -this._width / 2,
            -this._height / 2,
            this._width / 2,
            this._height / 2
        )

        const strokeHalf = 1
        let strokeEllipse = canvasKit.LTRBRect(
            (-this._width / 2) + strokeHalf,
            (-this._height / 2) + strokeHalf,
            (this._width / 2) - strokeHalf,
            (this._height / 2) - strokeHalf
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