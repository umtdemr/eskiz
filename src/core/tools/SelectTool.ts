import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";

export class SelectTool implements Tool {
    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'default';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
    }

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
    }
    
}