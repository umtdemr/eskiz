import type { Canvas, Point } from './Canvas'
import { Stage } from '../stage/Stage'
import { Signal } from '../signal/Signal'
import { LTRBRect } from '../geometry/BoundingBox'
import {
    easeInOutCubic,
    fitView,
    interpolateView,
    View,
} from '../geometry/math'
import { ZOOM_LEVELS } from '@/helpers/Constant'

export class Camera {
    private canvas: Canvas
    private stage: Stage
    private _zoom = 1
    private _translateX = 0
    private _translateY = 0
    // runs before each canvas frame while animating
    private step: (() => void) | null = null

    padding = 96

    // once per change of the view, after zoom and translate are both set
    changed = new Signal()
    zoomChanged = new Signal<number>()

    constructor(canvas: Canvas, stage: Stage) {
        this.canvas = canvas
        this.stage = stage
    }

    get zoom() {
        return this._zoom
    }

    get translateX() {
        return this._translateX
    }

    get translateY() {
        return this._translateY
    }

    /** the part of the board on screen */
    get viewport(): LTRBRect {
        return {
            left: -this._translateX,
            top: -this._translateY,
            right: this.canvas.width / this._zoom - this._translateX,
            bottom: this.canvas.height / this._zoom - this._translateY,
        }
    }

    /** a board point on the screen, in css pixels */
    toScreen(p: Point): Point {
        return {
            x: (p.x + this._translateX) * this._zoom,
            y: (p.y + this._translateY) * this._zoom,
        }
    }

    /** a screen point, in css pixels, on the board */
    toBoard(p: Point): Point {
        return {
            x: p.x / this._zoom - this._translateX,
            y: p.y / this._zoom - this._translateY,
        }
    }

    /** moves the view, stops a running animation */
    set(view: Partial<View>) {
        this.stop()
        this.apply(view)
    }

    zoomTo(zoom: number) {
        // around the screen center
        this.zoomAt(zoom, this.canvas.width / 2, this.canvas.height / 2)
    }

    /** keeps the screen point x, y in place, then pans by dx, dy screen pixels */
    zoomAt(zoom: number, x: number, y: number, dx = 0, dy = 0) {
        const oldZoom = this._zoom
        const newZoom = clampZoom(zoom)

        this.set({
            zoom: newZoom,
            translateX:
                x / newZoom - x / oldZoom + this._translateX + dx / oldZoom,
            translateY:
                y / newZoom - y / oldZoom + this._translateY + dy / oldZoom,
        })
    }

    /** shows `rect` on the screen. `maxZoom` keeps a small area from filling it */
    fit(
        rect: LTRBRect,
        { padding = this.padding, maxZoom = 1, animate = false } = {},
    ) {
        const { width, height } = this.canvas
        const view = fitView(rect, width, height, padding, maxZoom)
        if (animate) {
            this.animateTo(view)
        } else {
            this.set(view)
        }
    }

    /** shows every widget, does nothing on an empty board */
    fitContent(options?: {
        padding?: number
        maxZoom?: number
        animate?: boolean
    }) {
        const bounds = this.stage.contentBounds()
        if (bounds) this.fit(bounds, options)
    }

    /** moving the view any other way, like a wheel or a pan, stops it */
    animateTo(view: View, { duration = 400 } = {}) {
        this.stop()

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        if (reduced || duration <= 0) {
            this.apply(view)
            return
        }

        const from = {
            zoom: this._zoom,
            translateX: this._translateX,
            translateY: this._translateY,
        }
        const start = performance.now()

        // on the canvas frame, so what it draws is never a step behind
        this.step = () => {
            const t = Math.min((performance.now() - start) / duration, 1)
            if (t === 1) {
                this.stop()
                // the exact target, the curve can land a hair off
                this.apply(view)
                return
            }

            const { width, height } = this.canvas
            this.apply(
                interpolateView(from, view, easeInOutCubic(t), width, height),
            )
        }
        this.canvas.tickBefore.add(this.step)
        // the target was fitted to the old size
        this.canvas.resized.add(this.stop, this)
    }

    stop() {
        if (!this.step) return
        this.canvas.tickBefore.remove(this.step)
        this.step = null
        this.canvas.resized.remove(this.stop, this)
    }

    dispose() {
        this.stop()
        this.changed.removeAll()
        this.zoomChanged.removeAll()
    }

    private apply(view: Partial<View>) {
        const oldZoom = this._zoom
        if (view.zoom !== undefined) this._zoom = clampZoom(view.zoom)
        if (view.translateX !== undefined) this._translateX = view.translateX
        if (view.translateY !== undefined) this._translateY = view.translateY

        this.canvas.requestRender()
        this.changed.dispatch()
        if (this._zoom !== oldZoom) this.zoomChanged.dispatch(this._zoom)
    }
}

const clampZoom = (zoom: number) =>
    Math.min(Math.max(ZOOM_LEVELS.MIN, zoom), ZOOM_LEVELS.MAX)
