import {Canvas as SkiaCanvas, CanvasKit} from "canvaskit-wasm";
import { Layer }from "../stage/Layer";
import { BoundingBox } from "../geometry/BoundingBox";
import { RenderContext } from "../canvas/Canvas";
import { LinkedList } from "../dataStructures/LinkedList";
import { Signal } from "../signal/Signal";

export type WidgetType = 'shape' | 'text' | 'multiSelector' | 'border'

export interface WidgetProps {
    x: number
    y: number
    width: number
    height?: number
    parentLayer: Layer
    visible?: boolean
}

export abstract class Widget extends Layer {
    protected _widgetType: WidgetType
    protected _x: number
    protected _y: number
    protected _width: number
    protected _height: number
    protected _layer: Layer
    protected _bounds: BoundingBox       // Global bounds (including parent transforms)
    protected _localBounds: BoundingBox  // Local bounds (object's own space)
    protected _selected: boolean = false;

    boundsChanged = new Signal()
    
    constructor(type: WidgetType, props: WidgetProps) {
        super({ name: 'widget' })

        this._children = new LinkedList<Widget>

        this._widgetType = type
        this._x = props.x
        this._y = props.y
        this._width = props.width
        if (props.height !== undefined) {
            this._height = props.height
        }
        this._layer = props.parentLayer
        this._isLayer = false
        this._bounds = new BoundingBox()
        this._localBounds = new BoundingBox()

        if (props.visible !== undefined) {
            this.visible = props.visible
        }
        
        this.updateBounds()
    }

    // Add a method to add child widgets
    addWidget(child: Widget) {
        // Use parent from Layer class instead of _layer
        child._parent = this
        this.addChildren(child)
        child.updateBounds()
    }

    // Override render to handle child widgets properly
    render(renderContext: RenderContext) {
        if (!this.visible) return
        const ctx = renderContext.ctx

        ctx.save()
        
        // Apply this widget's transform
        ctx.translate(this._x, this._y)
        
        // Render this widget
        this.renderContent(renderContext)
        
        // Render children
        super.render(renderContext)
        
        ctx.restore()
    }

    // New abstract method for actual widget rendering
    protected abstract renderContent(renderContext: RenderContext): void

    updateBounds() {
        // Update local bounds (object's own space)
        this._localBounds.x = 0
        this._localBounds.y = 0
        this._localBounds.width = this._width
        this._localBounds.height = this._height

        // Update global bounds by starting with local bounds
        this._bounds.x = this._localBounds.x
        this._bounds.y = this._localBounds.y
        this._bounds.width = this._localBounds.width
        this._bounds.height = this._localBounds.height

        // Transform bounds to global space
        this._bounds.x += this._x
        this._bounds.y += this._y

        // Apply parent transforms
        let currentParent = this._parent
        while (currentParent instanceof Widget) {
            this._bounds.x += currentParent._x
            this._bounds.y += currentParent._y
            currentParent = currentParent._parent
        }

        if (this.interactive) this.boundsChanged.dispatch()
    }

    getBoundingRect() {
        return {
            x: this._x,
            y: this._y,
            width: this.width,
            height: this.height,
        }
    }

    get width() {
        return this._width
    }

    set width(width: number) {
        this._width = width
        this.updateBounds();
    }

    get height() {
        return this._height
    }

    set height(height: number) {
        this._height = height
        this.updateBounds();
    }

    get centerX() {
        return this._x + this.width / 2
    }

    set centerX(centerX: number) {
        this._x = centerX
        this.updateBounds();
    }

    get centerY() {
        return this._y + this.height / 2
    }

    set centerY(centerY: number) {
        this._y = centerY - this.height / 2
        this.updateBounds();
    }

    get left() {
        return this._x
    }

    set left(left: number) {
        this._x = left
        this.updateBounds();
    }

    get top() {
        return this._y
    }

    set top(top: number) {
        this._y = top
        this.updateBounds();
    }

    get right() {
        return this._x + this._width
    }

    set right(right: number) {
        this._x = right - this.width
        this.updateBounds();
    }

    get bottom() {
        return this._y + this._height
    }

    set bottom(bottom: number) {
        this._y = bottom - this.height
        this.updateBounds();
    }

    get bounds(): BoundingBox {
        return this._bounds
    }

    get localBounds(): BoundingBox {
        return this._localBounds
    }

    get selected(): boolean {
        return this._selected;
    }

    set selected(val: boolean) {
        this._selected = val
    }
}