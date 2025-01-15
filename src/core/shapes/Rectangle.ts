import {CanvasKit, Canvas as SkiaCanvas} from 'canvaskit-wasm';
import {Shape} from "@/core/shapes/Shape.ts";

export type RectangleProps = {
    x: number
    y: number
    width: number
    height: number
}

export class Rectangle extends Shape {
    private _x: number
    private _y: number
    private _width: number
    private _height: number
    
    constructor(props: RectangleProps) {
        super()
        this._x = props.x
        this._y = props.y
        this._width = props.width
        this._height = props.height
    }
    
    render(canvasKit: CanvasKit, canvas: SkiaCanvas) {
        // can not render if width or height is less than 0
        if (this._width <= 0 || this._height <= 0) {
            return
        }
        canvas.translate(this._x, this._y)
        const paint = new canvasKit.Paint();
        paint.setStrokeWidth(2)
        paint.setColor(canvasKit.Color4f(0, 0, 0, 1.0));
        paint.setStyle(canvasKit.PaintStyle.Stroke);
        paint.setAntiAlias(true);

        const rect = canvasKit.LTRBRect(
            -this._width / 2,
            -this._height / 2,
            this._width / 2,
            this._height / 2
        )

        canvas.drawRect(rect, paint)
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