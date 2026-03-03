import { Layer } from '../stage/Layer'
import { Engine } from '../engine/Engine'
import { BoundingBox } from '../geometry/BoundingBox'
import { RenderContext } from '../canvas/Canvas'
import { LinkedList } from '../dataStructures/LinkedList'
import { Signal } from '../signal/Signal'
import { WsWidget } from '@/types/Websocket.ts'
import type { Line } from '@/core/shapes/line/Line'
import {
    PathType as PathTypeConst,
    ShapeType as ShapeTypeConst,
    TextType as TextTypeConst,
    WidgetType as WidgetTypeConst,
    LineType as LineTypeConst,
    ImageType as ImageTypeConst,
    StickyNoteType as StickyNoteTypeConst,
} from '@/core/constants.ts'
import { rotatePoint, reverseRotatePoint } from '@/core/geometry/math'

export type WidgetType = (typeof WidgetTypeConst)[keyof typeof WidgetTypeConst]

export type DbWidgetType =
    | typeof WidgetTypeConst.SHAPE
    | typeof WidgetTypeConst.TEXTBOX
    | typeof WidgetTypeConst.PATH
    | typeof WidgetTypeConst.LINE
    | typeof WidgetTypeConst.IMAGE
    | typeof WidgetTypeConst.STICKY_NOTE

export type SubType =
    | (typeof ShapeTypeConst)[keyof typeof ShapeTypeConst]
    | typeof TextTypeConst.TEXTBOX
    | typeof PathTypeConst.PEN
    | typeof LineTypeConst.LINE
    | typeof ImageTypeConst.IMAGE
    | typeof StickyNoteTypeConst.STICKY_NOTE

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
    angle?: number
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
    protected _angle: number = 0
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
    protected _engine: Engine

    public attachedLineIds: Set<string> = new Set()
    public attachedLines: Set<Line> = new Set()

    boundsChanged = new Signal()
    deselected = new Signal()
    clicked = new Signal<WidgetClickedSignal>()
    deleted = new Signal()

    constructor(type: WidgetType, props: WidgetProps, engine: Engine) {
        super({ name: 'widget' })

        this._engine = engine
        this._children = new LinkedList<Widget>()

        this._widgetType = type
        this._x = props.x
        this._y = props.y
        this._width = props.width
        if (props.height !== undefined) {
            this._height = props.height
        }

        this._angle = props.angle ?? 0

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

    get visible(): boolean {
        return this._visible && !this._isDeleted
    }

    set visible(val: boolean) {
        this._visible = val
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

        // TODO: we should use world transform if we decide to use children
        // with current implementation, we render the widget if it has a parent
        // widget even if it is outside the viewport
        if (renderContext.viewport && !(this._parent instanceof Widget)) {
            const vp = renderContext.viewport
            const b = this.bounds
            const padding = 5
            if (
                b.right + padding < vp.left ||
                b.left - padding > vp.right ||
                b.bottom + padding < vp.top ||
                b.top - padding > vp.bottom
            ) {
                return
            }
        }

        const ctx = renderContext.ctx

        ctx.save()

        // Apply this widget's transform
        ctx.translate(this._x, this._y)
        ctx.rotate(this._angle, this._width / 2, this._height / 2)

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

        let globalOffsetX = this._x
        let globalOffsetY = this._y

        // calculate AABB for rotation
        if (this._angle === 0) {
            this._bounds.x = globalOffsetX
            this._bounds.y = globalOffsetY
            this._bounds.width = this._width
            this._bounds.height = this._height
        } else {
            const cx = globalOffsetX + this._width / 2
            const cy = globalOffsetY + this._height / 2
            const hw = this._width / 2
            const hh = this._height / 2

            const corners = [
                { x: cx - hw, y: cy - hh },
                { x: cx + hw, y: cy - hh },
                { x: cx + hw, y: cy + hh },
                { x: cx - hw, y: cy + hh },
            ]

            let minX = Infinity
            let minY = Infinity
            let maxX = -Infinity
            let maxY = -Infinity

            for (const c of corners) {
                // rotate corner around center
                const rotated = rotatePoint(c.x, c.y, cx, cy, this._angle)
                const globalX = rotated.x
                const globalY = rotated.y

                if (globalX < minX) minX = globalX
                if (globalY < minY) minY = globalY
                if (globalX > maxX) maxX = globalX
                if (globalY > maxY) maxY = globalY
            }

            this._bounds.x = minX
            this._bounds.y = minY
            this._bounds.width = maxX - minX
            this._bounds.height = maxY - minY
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
        let isMoved = false
        let isResized = false
        for (const key of Object.keys(json)) {
            switch (key) {
                case 'x':
                    this.left = json.x!
                    isMoved = true
                    break
                case 'y':
                    this.top = json.y!
                    isMoved = true
                    break
                case 'width':
                    this.width = json.width!
                    isResized = true
                    break
                case 'height':
                    this.height = json.height!
                    isResized = true
                    break
                case 'z_index':
                    this.zIndex = json.z_index!
                    if (this._parent instanceof Layer) {
                        this._parent.repositionChild(this)
                    }
                    break
                case 'is_deleted':
                    this._isDeleted = json.is_deleted!
                    break
                case 'is_locked':
                    this.isLocked = json.is_locked!
                    break
                case 'properties':
                    this._properties = {
                        ...this.properties,
                        ...json.properties,
                    }
                    break
            }
        }

        if (isMoved || isResized) {
            for (const line of this.attachedLines) {
                line.headBinding?.id === this._uuid &&
                    line.updatePointFromBinding('head')
                line.tailBinding?.id === this._uuid &&
                    line.updatePointFromBinding('tail')
            }
        }
    }

    contains(x: number, y: number, scale: number): boolean {
        const sx = x * scale
        const sy = y * scale

        if (this._angle === 0) {
            return this._bounds.contains(sx, sy)
        }

        const cx = this._x + this._width / 2
        const cy = this._y + this._height / 2
        const local = reverseRotatePoint(sx, sy, cx, cy, this._angle)
        return this._localBounds.contains(local.x - this._x, local.y - this._y)
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

    static loadFromJson(json: WsWidget, engine: Engine): Widget {
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

    // return true when changing font style is allowed
    canChangeFontStyle(): boolean {
        return false
    }

    // return true when widget can be rotated
    canRotate(): boolean {
        return false
    }

    rotate(newAngle: number) {
        if (newAngle < 0 || newAngle >= 360) {
            newAngle = ((newAngle % 360) + 360) % 360
        }
        this._angle = newAngle
        this.updateBounds()

        for (const line of this.attachedLines) {
            line.headBinding?.id === this._uuid &&
                line.updatePointFromBinding('head')
            line.tailBinding?.id === this._uuid &&
                line.updatePointFromBinding('tail')
        }
    }

    // resizes the widget.
    // good for changing position or dimension at once since it calls `updateBounds` only once
    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        let resized = false
        if (opt.left !== undefined) {
            this._x = opt.left
            resized = true
        }
        if (opt.top !== undefined) {
            this._y = opt.top
            resized = true
        }
        if (opt.width !== undefined) {
            this._width = opt.width
            resized = true
        }
        if (opt.height !== undefined) {
            this._height = opt.height
            resized = true
        }

        if (resized) {
            this.updateBounds()
            for (const line of this.attachedLines) {
                line.headBinding?.id === this._uuid &&
                    line.updatePointFromBinding('head')
                line.tailBinding?.id === this._uuid &&
                    line.updatePointFromBinding('tail')
            }
        }
        return resized
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

    move(newX: number, newY: number, ctx?: { lines: Set<string> }) {
        this._x = newX
        this._y = newY
        this.updateBounds()

        for (const line of this.attachedLines) {
            if (ctx?.lines?.has(line._uuid!)) {
                console.log('continue')
                continue
            }
            line.headBinding?.id === this._uuid &&
                line.updatePointFromBinding('head')
            line.tailBinding?.id === this._uuid &&
                line.updatePointFromBinding('tail')
        }
    }

    addAttachedLine(line: Line) {
        this.attachedLines.add(line)
        if (line.uuid) {
            this.attachedLineIds.add(line.uuid)
        }
    }

    removeAttachedLine(line: Line) {
        this.attachedLines.delete(line)
        if (line.uuid) {
            this.attachedLineIds.delete(line.uuid)
        }
    }

    getPointFromRelative(rx: number, ry: number): { x: number; y: number } {
        // find center of the widget (unrotated)
        const cx = this.centerX
        const cy = this.centerY

        // find the unrotated point
        const localX = cx + rx * (this.width / 2)
        const localY = cy + ry * (this.height / 2)
        if (this._angle === 0) {
            return { x: localX, y: localY }
        }

        // apply rotation matrix
        return rotatePoint(localX, localY, cx, cy, this._angle)
    }

    getRelativeFromPoint(x: number, y: number): { rx: number; ry: number } {
        let localX = x
        let localY = y

        if (this._angle !== 0) {
            const unrotated = reverseRotatePoint(
                x,
                y,
                this.centerX,
                this.centerY,
                this._angle,
            )
            localX = unrotated.x
            localY = unrotated.y
        }

        const rx = (localX - this.centerX) / (this.width / 2)
        const ry = (localY - this.centerY) / (this.height / 2)
        return { rx, ry }
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

    get angle() {
        return this._angle
    }

    set angle(angle: number) {
        this._angle = angle
        this.updateBounds()
    }

    canSnap(): boolean {
        return false
    }

    getSnapPoints(): { x: number; y: number }[] {
        return []
    }

    get engine() {
        return this._engine
    }

    requestRender() {
        this._engine.canvas.requestRender()
    }
}
