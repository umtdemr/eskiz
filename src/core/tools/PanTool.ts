import {Tool} from "@/core/tools/Tool.ts";
import {Engine, CanvasMouseEvent} from "@/core/engine/Engine.ts";

export class PanTool implements Tool {
    private startPanX = 0;
    private startPanY = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private _isPanning = false

    constructor() {
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'grab';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine) {
        const { e, canvas } = data;
        if (engine.activeMode.mainMode !== 'pan') {
            return
        }
        this._isPanning = true;
        this.startPanX = e.clientX - canvas.translateX * canvas.zoom;
        this.startPanY = e.clientY - canvas.translateY * canvas.zoom;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    onMouseMove(data: CanvasMouseEvent, engine: Engine) {
        const { e, canvas } = data
        if (engine.activeMode.mainMode === 'pan' && this._isPanning) {
            engine.upperCanvasEl.style.cursor = 'grabbing';

            canvas.translateX = (e.clientX - this.startPanX) / canvas.zoom;
            canvas.translateY = (e.clientY - this.startPanY) / canvas.zoom;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.requestRender()
        }
    }
    onMouseUp(e: CanvasMouseEvent, engine: Engine) {
        if (this._isPanning) {
            this._isPanning = false;
            engine.upperCanvasEl.style.cursor = 'grab';
        }
    }
}