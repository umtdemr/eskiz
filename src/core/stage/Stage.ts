import { Canvas as SkiaCanvas } from "canvaskit-wasm";
import {STAGE_LAYERS} from "@/helpers/Constant.ts";
import {Layer} from "./Layer.ts";
import { Widget } from "../shapes/Widget.ts";

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

    constructor() {
        // setup layers
        this._root = new Layer({
            name: STAGE_LAYERS.ROOT
        })
        this._canvasContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER
        })
        this._root.addChildren(this._canvasContainer)
        this._canvasStaticContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER_STATIC
        })

        // add widget layers for canvas static container
        this._widgetsDefaultLayer = new Layer({
            name: STAGE_LAYERS.WIDGETS_DEFAULT_LAYER
        })
        this._canvasStaticContainer.addChildren(this._widgetsDefaultLayer)

        
        this._canvasDynamicContainer = new Layer({
            name: STAGE_LAYERS.CANVAS_CONTAINER_DYNAMIC
        })
        this._canvasContainer.addChildren(this._canvasStaticContainer, this._canvasDynamicContainer)

        this._nonCanvasContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER
        })
        this._root.addChildren(this._nonCanvasContainer)
        this._nonCanvasStaticContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER_STATIC
        })
        this._nonCanvasDynamicContainer = new Layer({
            name: STAGE_LAYERS.NON_CANVAS_CONTAINER_DYNAMIC
        })

        this._nonCanvasContainer.addChildren(
            this._nonCanvasStaticContainer, 
            this._nonCanvasDynamicContainer
        )
    }

    /**
     * Adds given widget to static canvas container
     * @param widget Widget to add
     */
    addWidget(widget: Widget) {
        this._widgetsDefaultLayer.addChildren(widget)
    }

    /**
     * Starts rendering from root. 
     * @param ctx Context to call canvas rendering API's.
     */
    render(ctx: SkiaCanvas) {
        this._root.render(ctx)
    }

    get staticCanvasContainer() {
        return this._canvasStaticContainer
    }

    get widgetsDefaultLayer() {
        return this._widgetsDefaultLayer
    }
}