import {Engine, CanvasMouseEvent} from "@/core/engine/Engine.ts";
import { Service } from "./Service";
import { MouseController } from "../engine/MouseController";

export class PanToolService extends Service {
    private mouseController: MouseController
    private startPanX = 0;
    private startPanY = 0;
    private _isPanning = false

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController

        this.init();
    }

    init() {
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseMove, this)
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'grab';
    }

    onMouseDown(data: CanvasMouseEvent) {
        const { e, canvas } = data;
        if (this.engine.activeMode.mainMode !== 'pan') {
            return
        }
        this._isPanning = true;
        this.startPanX = e.clientX - canvas.translateX * canvas.zoom;
        this.startPanY = e.clientY - canvas.translateY * canvas.zoom;
    }
    
    onMouseMove(data: CanvasMouseEvent) {
        const { e, canvas } = data
        if (this.engine.activeMode.mainMode === 'pan' && this._isPanning) {
            this.engine.upperCanvasEl.style.cursor = 'grabbing';

            canvas.translateX = (e.clientX - this.startPanX) / canvas.zoom;
            canvas.translateY = (e.clientY - this.startPanY) / canvas.zoom;

            canvas.requestRender()
        }
    }

    onMouseUp() {
        if (this._isPanning) {
            this._isPanning = false;
            this.engine.upperCanvasEl.style.cursor = 'grab';
        }
    }
    
    dispose() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseMove, this)
    }
}