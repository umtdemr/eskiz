import { Canvas } from './Canvas'
import { Stage } from '../stage/Stage'
import { Signal } from '../signal/Signal'
import { LTRBRect } from '../geometry/BoundingBox'
import {
    easeInOutCubic,
    fitView,
    interpolateView,
    View,
} from '../geometry/math'

export class Camera {
    private canvas: Canvas
    private stage: Stage
    // frame of the running animation, 0 when there is none
    private animation = 0
    private isAnimating = false

    padding = 96

    zoomChanged = new Signal<number>()

    constructor(canvas: Canvas, stage: Stage) {
        this.canvas = canvas
        this.stage = stage
    }

    get zoom() {
        return this.canvas.zoom
    }

    zoomTo(zoom: number) {
        // around the screen center
        this.zoomAt(zoom, this.canvas.width / 2, this.canvas.height / 2)
    }

    /** keeps the screen point x, y in place, then pans by dx, dy screen pixels */
    zoomAt(zoom: number, x: number, y: number, dx = 0, dy = 0) {
        const canvas = this.canvas
        const oldZoom = canvas.zoom
        canvas.zoom = zoom
        const newZoom = canvas.zoom

        canvas.translateX =
            x / newZoom - x / oldZoom + canvas.translateX + dx / oldZoom
        canvas.translateY =
            y / newZoom - y / oldZoom + canvas.translateY + dy / oldZoom

        canvas.requestRender()
        this.zoomChanged.dispatch(canvas.zoom)
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
            this.set(view)
            return
        }

        const from = {
            zoom: this.canvas.zoom,
            translateX: this.canvas.translateX,
            translateY: this.canvas.translateY,
        }
        const start = performance.now()

        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const { width, height } = this.canvas

            this.isAnimating = true
            this.set(
                interpolateView(from, view, easeInOutCubic(t), width, height),
            )
            this.isAnimating = false

            if (t < 1) {
                this.animation = requestAnimationFrame(step)
            } else {
                this.stop()
            }
        }

        this.canvas.transform.add(this.onMoved, this)
        // the target was fitted to the old size
        this.canvas.resized.add(this.stop, this)
        this.animation = requestAnimationFrame(step)
    }

    stop() {
        if (!this.animation) return
        cancelAnimationFrame(this.animation)
        this.animation = 0
        this.canvas.transform.remove(this.onMoved, this)
        this.canvas.resized.remove(this.stop, this)
    }

    dispose() {
        this.stop()
        this.zoomChanged.removeAll()
    }

    private onMoved() {
        if (!this.isAnimating) this.stop()
    }

    private set(view: View) {
        this.canvas.zoom = view.zoom
        this.canvas.translateX = view.translateX
        this.canvas.translateY = view.translateY

        this.canvas.requestRender()
        this.zoomChanged.dispatch(this.canvas.zoom)
    }
}
