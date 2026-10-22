import { Canvas } from '../canvas/Canvas'
import { Engine } from '../engine/Engine'
import { MouseController, PinchEvent } from '../engine/MouseController'
import { Service } from './Service'

export class WheelService extends Service {
    private canvas: Canvas
    private mouseController: MouseController

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController
        this.onMouseWheel = this.onMouseWheel.bind(this)
    }

    start() {
        this.engine.upperCanvasEl.addEventListener('wheel', this.onMouseWheel)
        this.mouseController.on('pinch', this.onPinch, this)
        this.canvas = this.engine.canvas
    }

    private onMouseWheel(e: WheelEvent) {
        // if mouse is in down state, ignore wheel event
        if (this.mouseController?.isMouseDown) {
            return
        }
        e.preventDefault()

        // handle panning if ctrl or meta is not pressed
        if (!e.ctrlKey && !e.metaKey) {
            const panSpeed = 1.5 / this.canvas.zoom
            this.canvas.translateX -= e.deltaX * panSpeed
            this.canvas.translateY -= e.deltaY * panSpeed

            this.canvas.requestRender()
            return
        }

        const zoomFactor = Math.pow(0.995, e.deltaY)
        this.engine.zoomAt(this.canvas.zoom * zoomFactor, e.clientX, e.clientY)
    }

    private onPinch({ x, y, scale, dx, dy }: PinchEvent) {
        this.canvas.translateX += dx / this.canvas.zoom
        this.canvas.translateY += dy / this.canvas.zoom
        this.engine.zoomAt(this.canvas.zoom * scale, x, y)
    }

    dispose() {
        this.engine.upperCanvasEl.removeEventListener(
            'wheel',
            this.onMouseWheel,
        )
        this.mouseController.off('pinch', this.onPinch, this)
    }
}
