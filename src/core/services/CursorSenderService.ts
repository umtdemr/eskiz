import { COLLAB_CURSOR_THROTTLING_TIME } from "@/helpers/Constant";
import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { WsEngine } from "../WsEngine";
import { Service } from "./Service";

export class CursorSenderService extends Service {
    private mouseController: MouseController
    private wsEngine: WsEngine
    private lastSend: number
    private sendingTimeout: NodeJS.Timeout

    constructor(engine: Engine, wsEngine: WsEngine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController
        this.wsEngine = wsEngine
        this.init()
    }

    init() {
        this.mouseController.on('mouseMove', this.onMouseMove, this)
    }
    
    onMouseMove(data: CanvasMouseEvent): void {
        // handle collaborator cursor
        const time = Date.now()
        clearTimeout(this.sendingTimeout) // clear old attempts to sync data
        const sender = this.sendCursorData.bind(this)

        if (!this.lastSend || time > this.lastSend + COLLAB_CURSOR_THROTTLING_TIME) {
            this.lastSend = time
            sender(data, this.wsEngine);
        } else {
            // send collab cursor data after some time to sync last data
            this.sendingTimeout = setTimeout(() => {
                sender(data, this.wsEngine)
            }, COLLAB_CURSOR_THROTTLING_TIME)
        } 
    }

    private sendCursorData(data: CanvasMouseEvent, wsEngine: WsEngine) {
        wsEngine.sendMessage<"cursor">(
            {
                type: 'cursor',
                data: {
                    x: data.pointer.x,
                    y: data.pointer.y,
                }
            }
        )
    }

    dispose(): void {
        this.mouseController.off('mouseMove', this.onMouseMove, this)
    }
}