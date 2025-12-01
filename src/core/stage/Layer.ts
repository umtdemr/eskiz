import { LinkedList } from '../dataStructures/LinkedList'
import { Widget } from '../shapes/Widget'
import { RenderContext } from '../canvas/Canvas'

interface LayerProps {
    name: string
}

/**
 * Layers represents Node of each stage.
 */
export class Layer {
    protected name: string
    protected _children: LinkedList<Layer | Widget>
    protected _zIndex: string
    protected _parent: Layer | Widget | null = null
    protected _isLayer: boolean = true
    protected _interactive: boolean = false
    protected _visible: boolean = true

    constructor(props: LayerProps) {
        this.name = props.name
        this._children = new LinkedList<Layer | Widget>()
    }

    addChildren(...children: Layer[]) {
        for (const child of children) {
            child._parent = this
            this._children.add(child)
        }
    }

    removeChild(child: Layer): boolean {
        const idx = this._children.find(
            (layer: Layer | Widget) => layer === child,
        )
        if (idx !== -1) {
            this._children.removeAt(idx)
            return true
        }

        return false
    }

    render(renderContext: RenderContext) {
        for (const child of this._children) {
            if (!child.visible) {
                continue
            }
            renderContext.ctx.save()
            child.render(renderContext)
            renderContext.ctx.restore()
        }
    }

    destroy() {}

    /**
     * Moves a child to the front (top) of the rendering order.
     */
    bringChildToFront(child: Layer | Widget): boolean {
        return this._children.moveToBack(child)
    }

    /**
     * Moves a child to the back (bottom) of the rendering order.
     */
    sendChildToBack(child: Layer | Widget): boolean {
        return this._children.moveToFront(child)
    }

    /**
     * Moves a child forward by one position in the rendering order.
     * TODO: check current viewport first!
     */
    bringChildForward(child: Layer | Widget): boolean {
        return this._children.moveTowardEnd(child)
    }

    /**
     * Moves a child backward by one position in the rendering order.
     * TODO: check current viewport first!
     */
    sendChildBackward(child: Layer | Widget): boolean {
        return this._children.moveTowardStart(child)
    }

    /**
     * Repositions a child in the correct position based on its zIndex.
     */
    repositionChild(child: Layer | Widget) {
        // Remove from current position
        const currentIdx = this._children.find((c) => c === child)
        if (currentIdx === -1) return

        this._children.removeAt(currentIdx)

        // Find correct position based on zIndex
        const siblings = this._children.toArray()
        let insertIdx = 0

        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i].zIndex > child.zIndex) {
                insertIdx = i
                break
            }
            insertIdx = i + 1
        }

        this._children.addAt(insertIdx, child)
    }

    get children() {
        return this._children
    }

    get childrenArray() {
        return this._children.toArray()
    }

    get zIndex(): string {
        return this._zIndex
    }

    set zIndex(val: string) {
        this._zIndex = val
    }

    get interactive(): boolean {
        return this._interactive
    }

    get visible(): boolean {
        return this._visible
    }

    set visible(val: boolean) {
        this._visible = val
    }
}
