import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import { Line } from '@/core/shapes/line/Line'
import { Signal } from '@/core/signal/Signal'

export class ReshapeHandler {
    private engine: Engine
    private shape: Line | null = null
    private pointIndex: number = -1

    reshapeStarted = new Signal<{ widgets: Widget[] }>()
    reshapeFinished = new Signal<{ widgets: Widget[] }>()

    constructor(engine: Engine) {
        this.engine = engine
    }

    start(_data: CanvasMouseEvent, shape: Line, pointIndex: number) {
        this.shape = shape
        this.pointIndex = pointIndex

        this.reshapeStarted.dispatch({ widgets: [shape] })
    }

    handle(data: CanvasMouseEvent): boolean {
        if (!this.shape || this.pointIndex === -1) return false

        const pointer = data.pointer
        const absolutePoints = [...this.shape.absolutePoints]

        if (this.pointIndex >= 0 && this.pointIndex < absolutePoints.length) {
            absolutePoints[this.pointIndex] = [pointer.x, pointer.y]
            this.shape.updateFromAbsolutePoints(
                absolutePoints as [number, number][],
            )

            this.engine.canvas.requestRender()
            return true
        }
        return false
    }

    end(_data: CanvasMouseEvent) {
        if (this.shape) {
            this.reshapeFinished.dispatch({ widgets: [this.shape] })
        }

        this.shape = null
        this.pointIndex = -1
    }
}
