import { Layer } from '../stage/Layer'
import { BoundingBox } from '../geometry/BoundingBox'
import { RenderContext } from '../canvas/Canvas'
import { LinkedList } from '../dataStructures/LinkedList'
import { Signal } from '../signal/Signal'
import { ShapeType } from '@/core/shapes/Shape.ts'
import { WsWidget } from '@/types/Websocket.ts'

export type WidgetType =
    | 'shape'
    | 'text'
    | 'shapeText' // text for shapes
    | 'path'
    | 'multiSelector'
    | 'border'
    | 'control'

export type DbWidgetType = 'shape'

export type SubType = ShapeType

export type WidgetFullType = `${DbWidgetType}_${SubType}`

export interface WidgetProps {
    x: number
    y: number
    width: number
    height?: number
    parentLayer?: Layer
    visible?: boolean
    uuid?: string
    z_index?: string
    parent_widget_id?: string
    is_locked?: boolean
}

export type WidgetJson = {
    x: number
    y: number
    width: number
    height: number
    z_index: string
    uuid: string
    properties: Record<string, unknown>
    widget_type: DbWidgetType
    sub_type?: SubType
    parent_widget_id?: string
    is_deleted: boolean
    is_locked: boolean
}

export interface WidgetClickedSignal {
    widget: Widget
}

export abstract class Widget extends Layer {
    protected _widgetType: WidgetType
    protected _x: number
    protected _y: number
    protected _width: number
    protected _height: number
    protected _uuid?: string
    protected _parent_widget_id?: string
    protected _layer?: Layer
    protected _bounds: BoundingBox // Global bounds (including parent transforms)
    protected _localBounds: BoundingBox // Local bounds (object's own space)
    protected _selected: boolean = false
    protected _isDynamic: boolean = false
    protected _isDeleted: boolean = false
    protected _isLocked: boolean = false
    protected _properties: Record<string, unknown>

    boundsChanged = new Signal()
    deselected = new Signal()
    clicked = new Signal<WidgetClickedSignal>()
    deleted = new Signal()

    constructor(type: WidgetType, props: WidgetProps) {
        super({ name: 'widget' })

        this._children = new LinkedList<Widget>()

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
        if (props.is_locked !== undefined) {
            this._isLocked = props.is_locked
        }
        if (props.z_index) {
            this._zIndex = props.z_index
        }
        if (props.uuid) {
            this._uuid = props.uuid
        }
        if (props.parent_widget_id) {
            this._parent_widget_id = props.parent_widget_id
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
        if (!this.visible || this._isDeleted) return
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

    toJson(): WidgetJson {
        throw new Error('must be implemented')
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        for (const key of Object.keys(json)) {
            switch (key) {
                case 'x':
                    this.left = json.x!
                    break
                case 'y':
                    this.top = json.y!
                    break
                case 'width':
                    this.width = json.width!
                    break
                case 'height':
                    this.height = json.height!
                    break
                case 'z_index':
                    this.zIndex = json.z_index!
                    break
                case 'is_locked':
                    this.isLocked = json.is_locked!
            }
        }
    }

    contains(x: number, y: number, scale: number): boolean {
        return this.bounds.contains(x * scale, y * scale)
    }

    onMouseEnter() {}
    onMouseLeave() {}

    destroy() {
        this.boundsChanged.removeAll()
        this.deselected.removeAll()
        this.clicked.removeAll()
    }

    delete() {
        this.isDeleted = true
        this.deleted.dispatch()
        this.destroy()
    }

    static loadFromJson(json: WsWidget): Widget {
        throw new Error(
            `loadFromJson is not implemented for ${json.widget_type}_${json.sub_type}`,
        )
    }

    // return true when changing bg color is allowed
    canChangeBgColor(): boolean {
        return false
    }

    // return true when changing border color is allowed
    canChangeBorderColor(): boolean {
        return false
    }

    // return true when changing border style is allowed
    canChangeBorderStyle(): boolean {
        return false
    }

    // return true when changing thickness is allowed
    canChangeThickness(): boolean {
        return false
    }

    // return true when changing roundness is allowed
    canChangeRoundness(): boolean {
        return false
    }

    // return true when changing text color is allowed
    canChangeTextColor(): boolean {
        return false
    }

    // return true when changing highlight/background color is allowed
    canChangeHighlightColor(): boolean {
        return false
    }

    // return true when changing text alignment is allowed
    canChangeTextAlign(): boolean {
        return false
    }

    // return true when changing font size is allowed
    canChangeFontSize(): boolean {
        return false
    }

    get width() {
        return this._width
    }

    set width(width: number) {
        this._width = width
        this.updateBounds()
    }

    get height() {
        return this._height
    }

    set height(height: number) {
        this._height = height
        this.updateBounds()
    }

    get centerX() {
        return this._x + this.width / 2
    }

    set centerX(centerX: number) {
        this._x = centerX
        this.updateBounds()
    }

    get centerY() {
        return this._y + this.height / 2
    }

    set centerY(centerY: number) {
        this._y = centerY - this.height / 2
        this.updateBounds()
    }

    get left() {
        return this._x
    }

    set left(left: number) {
        this._x = left
        this.updateBounds()
    }

    set x(x: number) {
        this._x = x
        this.updateBounds()
    }

    set y(y: number) {
        this._y = y
        this.updateBounds()
    }

    get top() {
        return this._y
    }

    set top(top: number) {
        this._y = top
        this.updateBounds()
    }

    get right() {
        return this._x + this._width
    }

    set right(right: number) {
        this._x = right - this.width
        this.updateBounds()
    }

    get bottom() {
        return this._y + this._height
    }

    set bottom(bottom: number) {
        this._y = bottom - this.height
        this.updateBounds()
    }

    get bounds(): BoundingBox {
        return this._bounds
    }

    get localBounds(): BoundingBox {
        return this._localBounds
    }

    get selected(): boolean {
        return this._selected
    }

    set selected(val: boolean) {
        this._selected = val
    }

    get uuid(): string | undefined {
        return this._uuid
    }

    set uuid(uuid: string) {
        if (this._uuid) {
            return
        }
        this._uuid = uuid
    }

    get isDynamic(): boolean {
        return this._isDynamic
    }

    get widgetType(): WidgetType {
        return this._widgetType
    }

    get isDeleted(): boolean {
        return this._isDeleted
    }

    set isDeleted(val: boolean) {
        this._isDeleted = val
    }

    get isLocked(): boolean {
        return this._isLocked
    }

    set isLocked(val: boolean) {
        this._isLocked = val
    }

    get parent(): Layer | Widget | null {
        return this._parent
    }

    get properties() {
        return this._properties
    }
}
