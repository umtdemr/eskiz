import {Canvas as SkiaCanvas} from 'canvaskit-wasm';
import {Shape} from "@/core/shapes/Shape.ts";
import {RGBA} from "@/core/shapes/Color.ts";
import {SHAPES} from "@/helpers/Constant.ts";
import { canvasKit } from '@/core/canvas/Canvas';

export type RectangleProps = {
    x: number
    y: number
    width: number
    height: number
    strokeColor?: RGBA
    fillColor?: RGBA
    radius?: number
}

export class Rectangle extends Shape {
    private _radius: number
    constructor(props: RectangleProps) {
        super(SHAPES.RECTANGLE, props)
        this._radius = props.radius >= 0 && props.radius <= 20 ? props.radius! : 0
    }
    
    render(ctx: SkiaCanvas) {
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        ctx.translate(this._x, this._y)

        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);
        let rect = canvasKit.LTRBRect(
            -this._width / 2,
            -this._height / 2,
            this._width / 2,
            this._height / 2
        )
        
        // since border width grows to inward and outward, we don't want it to look like outside the bounding box,
        // so here, we just adjust te position of rectangle for drawing border
        const strokeHalf = 1
        let strokeRect = canvasKit.LTRBRect(
            (-this._width / 2) + strokeHalf,
            (-this._height / 2) + strokeHalf,
            (this._width / 2) - strokeHalf,
            (this._height / 2) - strokeHalf
        )
        
        // method to call draw rect in canvas kit
        let drawFn = 'drawRect'
        
        // if this has radius, create radius rect
        if (this._radius) {
            rect = canvasKit.RRectXY(rect, this._radius, this._radius)
            strokeRect = canvasKit.RRectXY(rect, this._radius, this._radius)
            drawFn = 'drawRRect'
        }
        
        // draw fill
        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(this._fillColor.r, this._fillColor.g, this._fillColor.b, this._fillColor.a)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);

        ctx[drawFn](rect, paint)

        // draw stroke
        const strokeColor = canvasKit.Color(this._strokeColor.r, this._strokeColor.g, this._strokeColor.b, this._strokeColor.a)
        paint.setColor(strokeColor);
        paint.setStyle(canvasKit.PaintStyle.Stroke);
        paint.setStrokeWidth(2)
        ctx[drawFn](strokeRect, paint)
    }
    
    renderControls(ctx: SkiaCanvas, scale: number) {
        ctx.save()
        const bbox = this.getBoundingRect()
        const paint = new canvasKit.Paint()
        paint.setStyle(canvasKit.PaintStyle.Stroke)
        paint.setColor(canvasKit.Color(0, 0, 255))
        paint.setStrokeWidth(1 / scale)

        const rect = canvasKit.XYWHRect(bbox.x, bbox.y, bbox.width, bbox.height)
        ctx.drawRect(rect, paint)
        ctx.restore()
    }
}