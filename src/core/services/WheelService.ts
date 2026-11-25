import { Engine } from '../engine/Engine'
import { MouseController, PinchEvent } from '../engine/MouseController'
import { Service } from './Service'

export class WheelService extends Service {
    private mouseController: MouseController

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController
        this.onMouseWheel = this.onMouseWheel.bind(this)
    }

    start() {
        this.engine.upperCanvasEl.addEventListener('wheel', this.onMouseWheel)
        this.mouseController.on('pinch', this.onPinch, this)
    }

    private onMouseWheel(e: WheelEvent) {
        // if mouse is in down state, ignore wheel event
        if (this.mouseController?.isMouseDown) {
            return
        }
        e.preventDefault()

        // handle panning if ctrl or meta is not pressed
        if (!e.ctrlKey && !e.metaKey) {
            const camera = this.engine.camera
            const panSpeed = 1.5 / camera.zoom
            camera.set({
                translateX: camera.translateX - e.deltaX * panSpeed,
                translateY: camera.translateY - e.deltaY * panSpeed,
            })
            return
        }

        const zoomFactor = Math.pow(0.995, e.deltaY)
        this.engine.camera.zoomAt(
            this.engine.camera.zoom * zoomFactor,
            e.clientX,
            e.clientY,
        )
    }

    private onPinch({ x, y, scale, dx, dy }: PinchEvent) {
        this.engine.camera.zoomAt(this.engine.camera.zoom * scale, x, y, dx, dy)
    }

    dispose() {
        this.engine.upperCanvasEl.removeEventListener(
            'wheel',
            this.onMouseWheel,
        )
        this.mouseController.off('pinch', this.onPinch, this)
    }
}
