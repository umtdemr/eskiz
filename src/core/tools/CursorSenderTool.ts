import {Tool} from "@/core/tools/Tool.ts";
import {Engine, CanvasMouseEvent} from "@/core/engine/Engine.ts";
import {COLLAB_CURSOR_THROTTLING_TIME} from "@/helpers/Constant.ts";
import {WsEngine} from "@/core/WsEngine.ts";

export class CursorSenderTool implements Tool {
    private lastSend: number
    private sendingTimeout: number


    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
    }
    
    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        // handle collaborator cursor
        const time = Date.now()
        clearTimeout(this.sendingTimeout) // clear old attempts to sync data
        const sender = this.sendCursorData.bind(this)

        if (!this.lastSend || time > this.lastSend + COLLAB_CURSOR_THROTTLING_TIME) {
            this.lastSend = time
            sender(data, engine.wsEngine);
        } else {
            // send collab cursor data after some time to sync last data
            this.sendingTimeout = setTimeout(() => {
                sender(data, engine.wsEngine)
            }, COLLAB_CURSOR_THROTTLING_TIME)
        } 
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
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
}