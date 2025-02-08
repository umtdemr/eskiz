import { Canvas as SkiaCanvas } from "canvaskit-wasm";
import {STAGE_LAYERS} from "@/helpers/Constant.ts";
import {Layer} from "./Layer.ts";
import { Widget } from "../shapes/Widget.ts";
import { Indexer } from "../indexer/Indexer.ts";

/**
 * Stage handles scene graph structure in canvas.
 */
export class Stage {
    private _root: Layer
    private _canvasContainer: Layer
    private _canvasStaticContainer: Layer
    private _widgetsDefaultLayer: Layer
    private _canvasDynamicContainer: Layer
    private _nonCanvasContainer: Layer
    private _nonCanvasStaticContainer: Layer
    private _nonCanvasDynamicContainer: Layer

    private _indexer: Indexer

    constructor() {
        // setup layers
        this._indexer = new Indexer();
        this._root = new Layer({
            name: STAGE_LAYERS.ROOT
        })
        this._root.zIndex = this._indexer.generateRootIndex()

        this.initializeLayers();
    }

    initializeLayers() {
        this._canvasContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER
        })
        this._canvasStaticContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER_STATIC
        })
        this._widgetsDefaultLayer = new Layer({
            name: STAGE_LAYERS.WIDGETS_DEFAULT_LAYER
        })
        this._canvasDynamicContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER_DYNAMIC
        })
        this._nonCanvasContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER
        })
        this._nonCanvasStaticContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER_STATIC
        })
        this._nonCanvasDynamicContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER_DYNAMIC
        })

        this._canvasContainer.zIndex = this._indexer.generateIndex(this._root, null)
        this._nonCanvasContainer.zIndex = this._indexer.generateIndex(this._canvasContainer, null)

        this._canvasStaticContainer.zIndex = this._indexer.generateIndex(
            this._canvasContainer,
            this._nonCanvasContainer
        )
        this._canvasDynamicContainer.zIndex = this._indexer.generateIndex(
            this._canvasStaticContainer,
            this._nonCanvasContainer
        )
        this._widgetsDefaultLayer.zIndex = this._indexer.generateIndex(
            this._canvasStaticContainer,
            this._canvasDynamicContainer
        )

        this._nonCanvasStaticContainer.zIndex = this._indexer.generateIndex(
            this._nonCanvasContainer,
            null
        )
        this._nonCanvasDynamicContainer.zIndex = this._indexer.generateIndex(
            this._nonCanvasStaticContainer,
            null
        )

        // add canvas and non canvas containers
        this.addChildToParent(this._root, this._canvasContainer)
        this.addChildToParent(this._root, this._nonCanvasContainer)

        // add static and dynamic containers to canvas container
        this.addChildToParent(this._canvasContainer, this._canvasStaticContainer)
        this.addChildToParent(this._canvasContainer, this._canvasDynamicContainer)

        // add default widget layer to static canvas container
        this.addChildToParent(this._canvasStaticContainer, this.widgetsDefaultLayer)

        // add static and dynamic containers to non canvas container
        this.addChildToParent(this._nonCanvasContainer, this._nonCanvasStaticContainer)
        this.addChildToParent(this._nonCanvasContainer, this._nonCanvasDynamicContainer)

        console.log(this._root)
    }

    /**
     * Adds given widget to static canvas container
     * @param widget Widget to add
     */
    addWidget(widget: Widget) {
        widget.zIndex = this._indexer.generateIndexForWidget(
            this._widgetsDefaultLayer,
            this._canvasDynamicContainer
        )
        this._widgetsDefaultLayer.addChildren(widget)
        console.log(widget.zIndex)
    }

    /**
     * Starts rendering from root. 
     * @param ctx Context to call canvas rendering API's.
     */
    render(ctx: SkiaCanvas) {
        this._root.render(ctx)
    }
    
    addChildToParent(parent: Layer, child: Layer) {
        parent.addChildren(child)
    }

    get staticCanvasContainer() {
        return this._canvasStaticContainer
    }

    get widgetsDefaultLayer() {
        return this._widgetsDefaultLayer
    }
}