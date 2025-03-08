import { Canvas } from '../canvas/Canvas';
import { Emitter } from '../emitter/Emitter';
import { CanvasMouseEvent, Engine } from './Engine';


export type EngineEventsMap = {
    'mouseDown': CanvasMouseEvent
    'mouseMove': CanvasMouseEvent
    'mouseUp': CanvasMouseEvent
    'doubleClick': CanvasMouseEvent
}

const DOUBLE_CLICK_DELAY = 300; // Max time between clicks for double click (ms)
const DOUBLE_CLICK_THRESHOLD = 5; // Max movement allowed between clicks (pixels)
const MOVE_THRESHOLD = 3; // Movement tolerance during click (pixels)

export class MouseController extends Emitter<EngineEventsMap> {
    private upperCanvasEl: HTMLCanvasElement
    private canvas: Canvas

    private lastClickTime = 0;
    private lastClickX = 0;
    private lastClickY = 0;
    
    private mouseDownX = 0;
    private mouseDownY = 0;
    private _isMouseDown = false;
    private _isMouseMovePrevented = false;

    private mouseMoveEvent: MouseEvent;
    private mouseMoved = false;

    constructor() {
        super()
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }
    
    start(engine: Engine) {
        this.upperCanvasEl = engine.upperCanvasEl
        this.canvas = engine.canvas
        this.canvas.tick.add(this.onTick, this)

        this.upperCanvasEl.addEventListener('mousedown', this.onMouseDown)
        this.upperCanvasEl.addEventListener('mouseup', this.onMouseUp)
        document.addEventListener('mousemove', this.onMouseMove)
    }

    private onTick() {
        if (!this.mouseMoved) return;
        const e = this.mouseMoveEvent

        const wrappedMouseEvent = this.wrapMouseEvent(e)
        let shouldEmit = true;

        if (this._isMouseDown && !this._isMouseMovePrevented) {
            const dx = Math.abs(e.clientX - this.mouseDownX)
            const dy = Math.abs(e.clientY - this.mouseDownY)
            
            // If move exceeds threshold, consider it an intentional move
            if (dx < MOVE_THRESHOLD || dy < MOVE_THRESHOLD) {
                shouldEmit = false
                this._isMouseMovePrevented = true;
            }
        }

        if (shouldEmit) {
            this.emit('mouseMove', wrappedMouseEvent)
        }
        this.mouseMoved = false;
    }

    private onMouseDown(e: MouseEvent) {
        this.mouseDownX = e.clientX
        this.mouseDownY = e.clientY
        this._isMouseDown = true;
        this._isMouseMovePrevented = false;

        const wrappedMouseEvent = this.wrapMouseEvent(e)
        this.emit('mouseDown', wrappedMouseEvent)
    }
    
    private onMouseMove(e: MouseEvent) {
        this.mouseMoveEvent = e
        this.mouseMoved = true;

    }
    
    private onMouseUp(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        const currentTime = Date.now()

        if (currentTime - this.lastClickTime <= DOUBLE_CLICK_DELAY) {
            const dx = Math.abs(e.clientX - this.lastClickX)
            const dy = Math.abs(e.clientY - this.lastClickY)
            
            if (dx <= DOUBLE_CLICK_THRESHOLD && dy <= DOUBLE_CLICK_THRESHOLD) {
                this.emit('doubleClick', wrappedMouseEvent)
            }
        }

        // Update last click information
        this.lastClickTime = currentTime
        this.lastClickX = e.clientX
        this.lastClickY = e.clientY
        this._isMouseDown = false;
        this._isMouseMovePrevented = false;

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

    get isMouseDown(): boolean {
        return this._isMouseDown
    }
}