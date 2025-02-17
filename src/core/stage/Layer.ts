import { Canvas as SkiaCanvas } from "canvaskit-wasm";
import { LinkedList } from "../dataStructures/LinkedList";
import { Widget } from "../shapes/Widget";
import { RenderContext } from "../canvas/Canvas";

interface LayerProps {
    name: string
}

/**
 * Layers represents Node of each stage.
 */
export class Layer {
    protected name: string
    protected _children: LinkedList
    protected _zIndex: string
    protected _parent: Layer|null = null
    protected _isLayer: boolean = true
    
    constructor(props: LayerProps) {
        this.name = props.name
        this._children = new LinkedList()
    }
    
    addChildren(...children: Layer[]) {
        for (const child of children) {
            child._parent = this
            this._children.add(child)
        }
    }

    render(renderContext: RenderContext) {
        for (const child of this._children) {
            if (child instanceof Widget && !child.visible) {
                continue
            }
            renderContext.ctx.save()
            child.render(renderContext)
            renderContext.ctx.restore()
        }
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
}