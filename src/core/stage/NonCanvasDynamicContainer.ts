import { Layer } from "@/core/stage/Layer";
import { STAGE_LAYERS } from "@/helpers/Constant";
import { MultiSelector } from "../shapes/nonCanvasShapes/MultiSelector";

/**
 * NonCanvasDynamicContainer handles dynamic non canvas layer for the app. Like multi selector, selection.
 */
export class NonCanvasDynamicContainer extends Layer {
    private _mutliSelector: MultiSelector

    constructor() {
        super({ name: STAGE_LAYERS.NON_CANVAS_CONTAINER_DYNAMIC })
        this._mutliSelector = new MultiSelector({
            x: 0,
            y: 0,
            parent: this
        })

        this.addChildren(
            this._mutliSelector
        )
    }

    get multiSelector(): MultiSelector {
        return this._mutliSelector
    }
}