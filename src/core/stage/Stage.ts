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
    addStaticWidget(widget: Widget) {
        this._canvasStaticContainer.addChildren(widget)
        console.log(this)
    }

    get staticCanvasContainer() {
        return this._canvasStaticContainer
    }
}