import {CanvasMouseEvent} from "@/core/engine/Engine.ts";
import {Engine} from "@/core/engine/Engine.ts";

// Tool handles mouse events
export interface Tool {
    onMouseDown: (data: CanvasMouseEvent, engine: Engine) => void
    onMouseMove: (data: CanvasMouseEvent, engine: Engine) => void
    onMouseUp: (data: CanvasMouseEvent, engine: Engine) => void
    onActivate?: (engine: Engine) => void
    onDeactivate?: () => void
}