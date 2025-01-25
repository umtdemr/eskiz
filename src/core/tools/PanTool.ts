import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent} from "@/core/canvas/Canvas.ts";
import {Engine} from "@/core/engine/Engine.ts";

export class PanTool implements Tool {
    private startPanX = 0;
    private startPanY = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private _isPanning = false

    constructor() {
    }

    onMouseDown(data: CanvasMouseEvent, _: Engine) {
        const { e, canvas } = data;
        if (canvas.activeMode.mainMode !== 'pan') {
            return
        }
        this._isPanning = true;
        this.startPanX = e.clientX - canvas.translateX * canvas.zoom;
        this.startPanY = e.clientY - canvas.translateY * canvas.zoom;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    onMouseMove(data: CanvasMouseEvent, _: Engine) {
        const { e, canvas } = data
        if (canvas.activeMode.mainMode === 'pan' && this._isPanning) {
            canvas.upperCanvas.style.cursor = 'grabbing';

            canvas.translateX = (e.clientX - this.startPanX) / canvas.zoom;
            canvas.translateY = (e.clientY - this.startPanY) / canvas.zoom;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.requestRender()
        }
    }
    onMouseUp(e: CanvasMouseEvent, _: Engine) {
        if (this._isPanning) {
            this._isPanning = false;
            e.canvas.upperCanvas.style.cursor = 'grab';
        }
    }
}