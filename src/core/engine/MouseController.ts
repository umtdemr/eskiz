import { Canvas } from '../canvas/Canvas'
import { Emitter } from '../emitter/Emitter'
import { CanvasMouseEvent, Engine } from './Engine'

// two finger gesture step, in screen pixels
export type PinchEvent = {
    x: number
    y: number
    scale: number
    dx: number
    dy: number
}

export type EngineEventsMap = {
    mouseDown: CanvasMouseEvent
    mouseMove: CanvasMouseEvent
    mouseUp: CanvasMouseEvent
    // press ended without a release (pinch, pen takeover, pointercancel)
    mouseCancel: CanvasMouseEvent
    doubleClick: CanvasMouseEvent
    contextMenu: CanvasMouseEvent
    pinch: PinchEvent
}

const DOUBLE_CLICK_DELAY = 300 // Max time between clicks for double click (ms)
const DOUBLE_CLICK_THRESHOLD = 5 // Max movement allowed between clicks (pixels)
const MOVE_THRESHOLD = 3 // Movement tolerance during click (pixels)
const TOUCH_SLOP = 8 // finger travel before a touch counts as a drag (pixels)
const PINCH_DELAY = 100 // time a second finger has to start a pinch (ms)
const PINCH_MIN_DIST = 30 // closer fingers would blow up the scale (pixels)

export class MouseController extends Emitter<EngineEventsMap> {
    private upperCanvasEl: HTMLCanvasElement
    private canvas: Canvas

    private lastClickTime = 0
    private lastClickX = 0
    private lastClickY = 0

    private mouseDownX = 0
    private mouseDownY = 0
    private _isMouseDown = false
    private pastThreshold = false

    private mouseMoved = false
    private lastEvent: PointerEvent

    private touches = new Map<number, { x: number; y: number }>()
    private pinching = false
    private pinchMoved = false
    private lastPinch = { x: 0, y: 0, dist: 0 }
    // touch down held back until we know it isn't a pinch
    private pendingDown: PointerEvent | null = null

    constructor() {
        super()
        this.onPointerDown = this.onPointerDown.bind(this)
        this.onPointerMove = this.onPointerMove.bind(this)
        this.onPointerUp = this.onPointerUp.bind(this)
        this.onContextMenu = this.onContextMenu.bind(this)
    }

    start(engine: Engine) {
        this.upperCanvasEl = engine.upperCanvasEl
        this.canvas = engine.canvas
        this.canvas.tick.add(this.onTick, this)

        this.upperCanvasEl.addEventListener('pointerdown', this.onPointerDown)
        this.upperCanvasEl.addEventListener('contextmenu', this.onContextMenu)
        document.addEventListener('pointerup', this.onPointerUp)
        document.addEventListener('pointercancel', this.onPointerUp)
        document.addEventListener('pointermove', this.onPointerMove)
    }

    private onTick() {
        if (this.pinchMoved) {
            this.pinchMoved = false
            this.movePinch()
        }
        this.flushMove()
    }

    private flushMove() {
        if (!this.mouseMoved) return
        const e = this.lastEvent

        const wrappedMouseEvent = this.wrapMouseEvent(e)
        let shouldEmit = true

        if (this._isMouseDown && !this.pastThreshold) {
            const dx = Math.abs(e.clientX - this.mouseDownX)
            const dy = Math.abs(e.clientY - this.mouseDownY)

            // If move exceeds threshold, consider it an intentional move
            if (dx < MOVE_THRESHOLD && dy < MOVE_THRESHOLD) {
                shouldEmit = false
            } else {
                this.pastThreshold = true
            }
        }

        if (shouldEmit) {
            this.emit('mouseMove', wrappedMouseEvent)
        }
        this.mouseMoved = false
    }

    private onPointerDown(e: PointerEvent) {
        // a pen landing next to a resting palm takes over
        if (e.pointerType === 'pen' && e.button === 0 && this.touches.size) {
            this.dropTouches()
        }
        // palm touches while a pen or mouse is down
        if (this._isMouseDown && e.pointerType !== this.lastEvent.pointerType) {
            return
        }

        if (e.pointerType === 'touch') {
            this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
            if (this.touches.size > 1) {
                this.startPinch()
                return
            }
        }

        if (this.pinching || this._isMouseDown || this.pendingDown) return
        // right and middle buttons don't drag or select
        if (e.button !== 0) return

        if (e.pointerType === 'touch') {
            this.pendingDown = e
            return
        }
        this.press(e)
    }

    private press(e: PointerEvent) {
        this.pendingDown = null
        this.mouseDownX = e.clientX
        this.mouseDownY = e.clientY
        this._isMouseDown = true
        this.pastThreshold = false
        this.lastEvent = e

        const wrappedMouseEvent = this.wrapMouseEvent(e)
        this.emit('mouseDown', wrappedMouseEvent)
    }

    private onPointerMove(e: PointerEvent) {
        // left press or release while another button is held
        if (e.pointerType === 'mouse' && e.button === 0) {
            const left = (e.buttons & 1) === 1
            if (this._isMouseDown && !left) {
                this.onPointerUp(e)
                return
            }
            if (!this._isMouseDown && left && e.target === this.upperCanvasEl) {
                this.onPointerDown(e)
                return
            }
        }
        const tracked = this.touches.has(e.pointerId)
        if (tracked) {
            this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
        }
        if (this.pinching) {
            if (tracked) this.pinchMoved = true
            return
        }
        if (this.pendingDown) {
            const down = this.pendingDown
            if (e.pointerId !== down.pointerId) return
            const dist = Math.hypot(
                e.clientX - down.clientX,
                e.clientY - down.clientY,
            )
            if (dist < TOUCH_SLOP) return
            // give a second finger time to land
            if (e.timeStamp - down.timeStamp < PINCH_DELAY) return
            this.press(down)
        }
        // a finger that isn't pressing isn't hovering either
        if (e.pointerType === 'touch' && !this._isMouseDown) return
        if (this._isMouseDown && e.pointerId !== this.lastEvent.pointerId) {
            return
        }

        this.mouseMoved = true
        this.lastEvent = e
    }

    private onPointerUp(e: PointerEvent) {
        this.touches.delete(e.pointerId)
        if (this.pinching) {
            // wait until every finger is lifted
            if (this.touches.size === 0) this.pinching = false
            else if (this.touches.size > 1) this.lastPinch = this.measurePinch()
            return
        }

        // a quick tap, send the held back down first
        if (this.pendingDown?.pointerId === e.pointerId) {
            const down = this.pendingDown
            this.pendingDown = null
            if (e.type === 'pointercancel') return
            this.press(down)
        }

        if (!this._isMouseDown || e.pointerId !== this.lastEvent.pointerId) {
            return
        }
        // not a click, just let go
        if (e.type === 'pointercancel') {
            this.endDrag()
            return
        }
        // last move of the frame goes out before the up
        this.flushMove()
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
        this._isMouseDown = false
        this.pastThreshold = false

        this.emit('mouseUp', wrappedMouseEvent)
    }

    private endDrag() {
        this._isMouseDown = false
        this.pastThreshold = false
        this.mouseMoved = false
        this.emit('mouseCancel', this.wrapMouseEvent(this.lastEvent))
    }

    private startPinch() {
        // a finger that already dragged ends its drag
        if (this._isMouseDown) this.endDrag()
        this.pendingDown = null
        this.pinching = true
        this.pinchMoved = false
        this.lastPinch = this.measurePinch()
    }

    private dropTouches() {
        if (this._isMouseDown) this.endDrag()
        this.pendingDown = null
        this.pinching = false
        this.pinchMoved = false
        this.touches.clear()
    }

    private movePinch() {
        if (this.touches.size < 2) return
        const next = this.measurePinch()
        const last = this.lastPinch

        this.emit('pinch', {
            x: next.x,
            y: next.y,
            scale:
                Math.max(next.dist, PINCH_MIN_DIST) /
                Math.max(last.dist, PINCH_MIN_DIST),
            dx: next.x - last.x,
            dy: next.y - last.y,
        })
        this.lastPinch = next
    }

    private measurePinch() {
        const [a, b] = this.touches.values()
        return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            dist: Math.hypot(a.x - b.x, a.y - b.y),
        }
    }

    private onContextMenu(e: MouseEvent) {
        e.preventDefault()
        if (this._isMouseDown || this.pinching) return
        // long press on touch, lifting the finger isn't a tap
        const fromMouse = 'pointerType' in e && e.pointerType === 'mouse'
        if (!fromMouse) this.pendingDown = null
        this.emit('contextMenu', this.wrapMouseEvent(e))
    }

    private wrapMouseEvent(e: MouseEvent): CanvasMouseEvent {
        return { e, pointer: this.canvas.getPointer(e), canvas: this.canvas }
    }

    dispose() {
        // never started
        if (!this.canvas) return
        this.canvas.tick.remove(this.onTick, this)
        this.upperCanvasEl.removeEventListener(
            'pointerdown',
            this.onPointerDown,
        )
        this.upperCanvasEl.removeEventListener(
            'contextmenu',
            this.onContextMenu,
        )
        document.removeEventListener('pointermove', this.onPointerMove)
        document.removeEventListener('pointerup', this.onPointerUp)
        document.removeEventListener('pointercancel', this.onPointerUp)
    }

    get isMouseDown(): boolean {
        return this._isMouseDown
    }
}
