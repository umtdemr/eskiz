import {Canvas} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {CollaboratorsRenderer} from "@/core/renderers/CollaboratorsRenderer.ts";

export class Engine {
    private _slugId: string
    canvas: Canvas
    wsEngine: WsEngine
    collaboratorsRenderer: CollaboratorsRenderer
    
    constructor(slugId: string) {
        this._slugId = slugId
        this.canvas = new Canvas(this._slugId)
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.collaboratorsRenderer = new CollaboratorsRenderer();
    }
    
    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()
        return true
    }

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
    }
}