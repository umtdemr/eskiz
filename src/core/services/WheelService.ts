import { Canvas } from "../canvas/Canvas";
import { Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { Service } from "./Service";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";

export class WheelService extends Service {
    private canvas: Canvas
    private mouseController: MouseController

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController;
        this.onMouseWheel = this.onMouseWheel.bind(this);
    }

    start() {
        this.engine.upperCanvasEl.addEventListener('wheel', this.onMouseWheel);
        this.canvas = this.engine.canvas;
    }

    private onMouseWheel(e: WheelEvent) {
        // if mouse is in down state, ignore wheel event
        if (this.mouseController?.isMouseDown) {
            return
        }
        e.preventDefault();

        // handle panning if ctrl or meta is not pressed
        if (!e.ctrlKey && !e.metaKey) {
            const panSpeed = 1.5 / this.canvas.zoom;
            this.canvas.translateX -= e.deltaX * panSpeed;
            this.canvas.translateY -= e.deltaY * panSpeed;

            this.canvas.requestRender();
            return
        }
        const mouseX = e.clientX
        const mouseY = e.clientY;

        const zoomFactor = e.deltaY > 0 ? 0.4 : 1.6;
        const oldScale = this.canvas.zoom;
        this.canvas.zoom = Math.min(Math.max(ZOOM_LEVELS.MIN, this.canvas.zoom * zoomFactor), ZOOM_LEVELS.MAX);

        this.canvas.translateX = mouseX / this.canvas.zoom - mouseX / oldScale + this.canvas.translateX;
        this.canvas.translateY = mouseY / this.canvas.zoom - mouseY / oldScale + this.canvas.translateY;

        this.canvas.requestRender()
        this.engine.emit('zoom', this.canvas.zoom)
    }

    dispose() {
        this.engine.upperCanvasEl.removeEventListener('wheel', this.onMouseWheel)
    }
}