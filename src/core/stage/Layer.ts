interface LayerProps {
    name: string
}


export class Layer {
    protected name: string
    protected children: Layer[]
    protected _zIndex: string
    protected _parent: Layer|null
    
    constructor(props: LayerProps) {
        this.name = props.name
        this.children = []
    }
    
    addChildren(...children: Layer[]) {
        for (const child of children) {
            child._parent = this
            this.children.push(child)
        }
    }
}