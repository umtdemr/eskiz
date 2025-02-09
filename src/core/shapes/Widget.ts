import {Canvas as SkiaCanvas, CanvasKit} from "canvaskit-wasm";
import { Layer }from "../stage/Layer";

export type WidgetType = 'shape' | 'text' | 'multiSelector'

export interface WidgetProps {
    x: number
    y: number
    width: number
    height?: number
    parentLayer: Layer
}

export abstract class Widget extends Layer {
    protected _widgetType: WidgetType
    protected _x: number
    protected _y: number
    protected _width: number
    protected _height: number
    protected _layer: Layer
    
    constructor(type: WidgetType, props: WidgetProps) {
        super({ name: 'widget' })
        this._widgetType = type
        this._x = props.x
        this._y = props.y
        this._width = props.width
        if (props.hasOwnProperty('height')) {
            this._height = props.height!
        }
        this._layer = props.parentLayer
        this._isLayer = false
    }
    abstract render(ctx: SkiaCanvas): void


    getBoundingRect() {
        return {
            x: this.left,
            y: this.top,
            width: this.width,
            height: this.height,
        }
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