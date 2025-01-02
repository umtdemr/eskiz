import {Canvas} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {CollaboratorsRenderer} from "@/core/renderers/CollaboratorsRenderer.ts";
import {COLLAB_CURSOR_THROTTLING_TIME} from "@/helpers/Constant.ts";

export class Engine {
    private _slugId: string
    canvas: Canvas
    wsEngine: WsEngine
    collaboratorsRenderer: CollaboratorsRenderer
    private collabCursorLastSend: number
    private collabCursorSendingTimeout: number
    
    constructor(slugId: string) {
        this._slugId = slugId
        this.canvas = new Canvas(this._slugId)
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.collaboratorsRenderer = new CollaboratorsRenderer();
        this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this)
    }
    
    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()
        this.canvas.on('mouseMove', this.canvasMouseMoveHandler)
        return true
    }

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
    }
    
    private canvasMouseMoveHandler(e: MouseEvent) {
        const time = Date.now()
        clearTimeout(this.collabCursorSendingTimeout) // clear old attempts to sync data
        const collabCursorSender = this.sendCollabCursorData

        if (!this.collabCursorLastSend || time > this.collabCursorLastSend + COLLAB_CURSOR_THROTTLING_TIME) {
            this.collabCursorLastSend = time
            collabCursorSender(e);
        } else {
            // send collab cursor data after some time to sync last data
            this.collabCursorSendingTimeout = setTimeout(() => {
                collabCursorSender(e)
            }, COLLAB_CURSOR_THROTTLING_TIME)
        }
    }
    
    private sendCollabCursorData(e: MouseEvent) {
        // todo: send
    }
}