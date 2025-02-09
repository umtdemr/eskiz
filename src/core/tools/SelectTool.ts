import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import { MultiSelector } from "../shapes/nonCanvasShapes/MultiSelector";

export class SelectTool implements Tool {
    private engine: Engine
    private multiSelector: MultiSelector
    private initialPosition: { x: number, y: number } = { x: 0, y: 0 }
    private isDrawing: boolean = false

    constructor(engine: Engine) {
        this.engine = engine
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'default';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
        this.isDrawing = true
        this.initialPosition = {
            x: data.pointer.x,
            y: data.pointer.y,
        }
        this.multiSelector = new MultiSelector({ x: this.initialPosition.x, y: this.initialPosition.y, parent: this.engine.stage.nonCanvasDynamicContainer})
        this.engine.stage.addDynamicNonCanvasWidget(this.multiSelector)
        this.engine.canvas.requestRender()
    }

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        if (!this.multiSelector || !this.isDrawing) {
            return
        }
        this.multiSelector.width = Math.abs(data.pointer.x - this.initialPosition.x)
        this.multiSelector.height = Math.abs(data.pointer.y - this.initialPosition.y)

        if (data.pointer.x > this.initialPosition.x) {
            this.multiSelector.left = this.initialPosition.x
        } else {
            this.multiSelector.right = this.initialPosition.x
        }
        
        if (data.pointer.y > this.initialPosition.y) {
            this.multiSelector.top = this.initialPosition.y
        } else {
            this.multiSelector.bottom = this.initialPosition.y
        }
        engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
        this.isDrawing = false;
    }
}