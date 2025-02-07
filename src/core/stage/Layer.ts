import { LinkedList } from "../dataStructures/LinkedList";

interface LayerProps {
    name: string
}


export class Layer {
    protected name: string
    protected _children: LinkedList
    protected _zIndex: string
    protected _parent: Layer|null = null;
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

    getChildren() {
        return this._children.toArray()
    }

    get children() {
        return this._children.toArray()
    }
}