import {Canvas} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {COLLAB_CURSOR_THROTTLING_TIME} from "@/helpers/Constant.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";

export class Engine {
    private _slugId: string
    canvas: Canvas
    wsEngine: WsEngine
    private collabCursorLastSend: number
    private collabCursorSendingTimeout: number
    upperCanvasRenderer: UpperCanvasRenderer
    
    constructor(slugId: string) {
        this._slugId = slugId
        this.canvas = new Canvas(this._slugId)
        this.upperCanvasRenderer = new UpperCanvasRenderer();
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this)
    }
    
    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()
        this.canvas.on('mouseMove', this.canvasMouseMoveHandler)
        
        // assign upper canvas el from canvas instance to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this.canvas.upperCanvas
        this.upperCanvasRenderer.run() // start rendering upper canvas
        return true
    }

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
    }
    
    private canvasMouseMoveHandler(e: MouseEvent) {
        const time = Date.now()
        clearTimeout(this.collabCursorSendingTimeout) // clear old attempts to sync data
        const collabCursorSender = this.sendCollabCursorData.bind(this)

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
        const pointer = this.canvas.getPointer(e)
        this.wsEngine.sendMessage<"cursor">(
        {
                type: 'cursor', 
                data: {
                    x: pointer.x, 
                    y: pointer.y, 
                }
            }
        )
    }
}