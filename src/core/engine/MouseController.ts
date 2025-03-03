import { Canvas } from '../canvas/Canvas';
import { Emitter } from '../emitter/Emitter';
import { CanvasMouseEvent, Engine } from './Engine';


export type EngineEventsMap = {
    'mouseDown': CanvasMouseEvent
    'mouseMove': CanvasMouseEvent
    'mouseUp': CanvasMouseEvent
}

export class MouseController extends Emitter<EngineEventsMap> {
    private upperCanvasEl: HTMLCanvasElement
    private canvas: Canvas

    constructor() {
        super()
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }
    
    start(engine: Engine) {
        this.upperCanvasEl = engine.upperCanvasEl
        this.canvas = engine.canvas

        this.upperCanvasEl.addEventListener('mousedown', this.onMouseDown)
        this.upperCanvasEl.addEventListener('mouseup', this.onMouseUp)
        document.addEventListener('mousemove', this.onMouseMove)
    }

    private onMouseDown(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        this.emit('mouseDown', wrappedMouseEvent)
    }
    
    private onMouseMove(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        this.emit('mouseMove', wrappedMouseEvent)
    }
    
    private onMouseUp(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        this.emit('mouseUp', wrappedMouseEvent)
    } 

    private wrapMouseEvent(e: MouseEvent): CanvasMouseEvent {
        return { e, pointer: this.canvas.getPointer(e), canvas: this.canvas }
    }

    dispose() {
        this.upperCanvasEl.removeEventListener('mousedown', this.onMouseDown)
        document.removeEventListener('mousemove', this.onMouseMove);
        this.upperCanvasEl.removeEventListener('mouseup', this.onMouseUp);
    }
}