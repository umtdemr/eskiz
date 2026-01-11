import { Layer } from '@/core/stage/Layer'
import { STAGE_LAYERS } from '@/helpers/Constant'
import { MultiSelector } from '../shapes/nonCanvasShapes/MultiSelector'
import { SelectionLayer } from './SelectionLayer'
import { Engine } from '../engine/Engine'
import { SelectionService } from '../services/SelectionService'
import { TrailLayer } from './TrailLayer'
import { MagnetLayer } from './MagnetLayer'

/**
 * NonCanvasDynamicContainer handles dynamic non canvas layer for the app. Like multi selector, selection.
 */
export class NonCanvasDynamicContainer extends Layer {
    private _mutliSelector: MultiSelector
    private _selectionLayer: SelectionLayer
    private _trailLayer: TrailLayer
    private _magnetLayer: MagnetLayer

    constructor(engine: Engine, selectionService: SelectionService) {
        super({ name: STAGE_LAYERS.NON_CANVAS_CONTAINER_DYNAMIC })
        this._mutliSelector = new MultiSelector({
            x: 0,
            y: 0,
            parent: this,
        })
        this._selectionLayer = new SelectionLayer(engine, selectionService)
        this._trailLayer = new TrailLayer(engine)

        this.addChildren(this._selectionLayer)
        this.addChildren(this._trailLayer)
        this.addChildren(this._mutliSelector)

        this._magnetLayer = new MagnetLayer()
        this.addChildren(this._magnetLayer)
    }

    get multiSelector(): MultiSelector {
        return this._mutliSelector
    }

    get selectionLayer(): SelectionLayer {
        return this._selectionLayer
    }

    get trailLayer(): TrailLayer {
        return this._trailLayer
    }

    get magnetLayer(): MagnetLayer {
        return this._magnetLayer
    }
}
