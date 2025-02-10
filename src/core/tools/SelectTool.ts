import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";

export class SelectTool implements Tool {
    private engine: Engine
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
        const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
        multiSelector.left = data.pointer.x
        multiSelector.top = data.pointer.y
        multiSelector.visible = true;
        this.engine.canvas.requestRender()
    }

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
        if (!multiSelector || !this.isDrawing) {
            return
        }
        multiSelector.width = Math.abs(data.pointer.x - this.initialPosition.x)
        multiSelector.height = Math.abs(data.pointer.y - this.initialPosition.y)

        if (data.pointer.x > this.initialPosition.x) {
            multiSelector.left = this.initialPosition.x
        } else {
            multiSelector.right = this.initialPosition.x
        }
        
        if (data.pointer.y > this.initialPosition.y) {
            multiSelector.top = this.initialPosition.y
        } else {
            multiSelector.bottom = this.initialPosition.y
        }
        engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
        this.isDrawing = false;
        this.engine.stage.nonCanvasDynamicContainer.multiSelector.visible = false;
        this.engine.canvas.requestRender()
    }
}