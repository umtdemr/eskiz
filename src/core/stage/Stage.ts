import { Canvas as SkiaCanvas } from "canvaskit-wasm";
import {STAGE_LAYERS} from "@/helpers/Constant.ts";
import {Layer} from "./Layer.ts";
import { Widget } from "../shapes/Widget.ts";
import { Indexer } from "../indexer/Indexer.ts";
import { NonCanvasDynamicContainer } from "./NonCanvasDynamicContainer.ts";
import { RenderContext } from "../canvas/Canvas.ts";
import { Engine } from "../engine/Engine.ts";
import { SelectionService } from "../services/SelectionService.ts";

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
    private _nonCanvasDynamicContainer: NonCanvasDynamicContainer

    private _indexer: Indexer
    private _engine: Engine

    constructor(engine: Engine) {
        // setup layers
        this._indexer = new Indexer();
        this._root = new Layer({
            name: STAGE_LAYERS.ROOT
        })
        this._root.zIndex = this._indexer.generateRootIndex()
        this._engine = engine;

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

        this._nonCanvasDynamicContainer = new NonCanvasDynamicContainer(
            this._engine,
            this._engine.getService<SelectionService>('selection')
        );

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
    }

    /**
     * Adds given widget to static canvas container
     * @param widget Widget to add
     */
    addWidget(widget: Widget) {
        widget.zIndex = this._indexer.generateIndexForWidget(
            this._widgetsDefaultLayer,
            null
        )
        this._widgetsDefaultLayer.addChildren(widget)
    }

    addDynamicNonCanvasWidget(widget: Widget) {
        widget.zIndex = this._indexer.generateIndexForWidget(
            this._nonCanvasDynamicContainer,
            null
        )
        this._nonCanvasDynamicContainer.addChildren(widget)
    }

    /**
     * Starts rendering from root. 
     * @param ctx Context to call canvas rendering API's.
     */
    render(renderContext: RenderContext) {
        this._root.render(renderContext)
    }
    
    /**
     * Generates and adds zIndex for child of the parent layer.
     * @param parent Parent layer.
     * @param child Child layer to add index.
     */
    addChildToParent(parent: Layer, child: Layer) {
        child.zIndex = this._indexer.generateIndexForChild(parent)
        parent.addChildren(child)
    }

    get staticCanvasContainer() {
        return this._canvasStaticContainer
    }

    get widgetsDefaultLayer() {
        return this._widgetsDefaultLayer
    }

    get nonCanvasDynamicContainer() {
        return this._nonCanvasDynamicContainer
    }
}