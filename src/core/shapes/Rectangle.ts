import {CanvasKit, Canvas as SkiaCanvas} from 'canvaskit-wasm';
import {Shape} from "@/core/shapes/Shape.ts";
import {RGBA} from "@/core/shapes/Color.ts";
import {CANVAS_COLORS} from "@/helpers/Constant.ts";

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
    private _x: number
    private _y: number
    private _width: number
    private _height: number
    private _strokeColor: RGBA
    private _fillColor: RGBA
    private _radius: number
    
    constructor(props: RectangleProps) {
        super()
        this._x = props.x
        this._y = props.y
        this._width = props.width
        this._height = props.height
        this._strokeColor = props.strokeColor ? props.strokeColor : CANVAS_COLORS.BLACK
        this._fillColor = props.fillColor ? props.fillColor : CANVAS_COLORS.TRANSPARENT
        this._radius = props.radius >= 0 && props.radius <= 20 ? props.radius! : 0
    }
    
    render(canvasKit: CanvasKit, canvas: SkiaCanvas) {
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        canvas.translate(this._x, this._y)

        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);
        let rect = canvasKit.LTRBRect(
            -this._width / 2,
            -this._height / 2,
            this._width / 2,
            this._height / 2
        )
        
        // method to call draw rect in canvas kit
        let drawFn = 'drawRect'
        
        // if this has radius, create radius rect
        if (this._radius) {
            rect = canvasKit.RRectXY(rect, this._radius, this._radius)
            drawFn = 'drawRRect'
        }
        
        // draw fill
        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(this._fillColor.r, this._fillColor.g, this._fillColor.b, this._fillColor.a)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);
        
        canvas[drawFn](rect, paint)

        // draw stroke
        const strokeColor = canvasKit.Color(this._strokeColor.r, this._strokeColor.g, this._strokeColor.b, this._strokeColor.a)
        paint.setColor(strokeColor);
        paint.setStyle(canvasKit.PaintStyle.Stroke);
        paint.setStrokeWidth(2)
        canvas[drawFn](rect, paint)
    }
    
    get width() {
        return this._width
    }
    
    set width(width: number) {
        this._width = width
    }
    
    get height() {
        return this._height
    }
    set height(height: number) {
        this._height = height
    }
    
    get centerX() {
        return this._x
    }
    /**
     * Align shape center x coordinate
     * @param centerX - new center x
     */
    set centerX(centerX: number) {
        this._x = centerX
    }

    /**
     * Align shape center y coordinate
     * @param centerY - new center y
     */
    set centerY(centerY: number) {
        this._y = centerY
    }

    get left() {
        return this._x - this._width / 2
    }

    /**
     * Align shape left with given coordinate
     * @param left - new left coordinate
     */
    set left(left: number) {
        this._x = left + this.width / 2
    }

    get top() {
        return this._y - this._height / 2
    }

    /**
     * Align shape top with given coordinate
     * @param top - new top coordinate
     */
    set top(top: number) {
        this._y = top + this.height / 2
    }

    /**
     * Align shape right with given coordinate
     * @param right - new right coordinate
     */
    set right(right: number) {
        this._x = right - this.width / 2
    }

    /**
     * Align shape bottom with given coordinate
     * @param bottom - new bottom coordinate
     */
    set bottom(bottom: number) {
        this._y = bottom - this.height / 2
    }
}