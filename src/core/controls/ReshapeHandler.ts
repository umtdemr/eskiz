import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import { Line } from '@/core/shapes/line/Line'
import { Signal } from '@/core/signal/Signal'
import { EditTable, TransactionId } from '@/core/transaction/TransactionHandler'
import { MagnetService } from '../services/MagnetService'

export class ReshapeHandler {
    private engine: Engine
    private shape: Line | null = null
    private pointIndex: number = -1
    private transactionId: TransactionId | null = null
    // store old bindings start of reshape
    private initialHeadBinding:
        | { id: string; rx: number; ry: number }
        | null
        | undefined = null
    private initialTailBinding:
        | { id: string; rx: number; ry: number }
        | null
        | undefined = null

    reshapeStarted = new Signal<{ widgets: Widget[] }>()
    reshapeFinished = new Signal<{ widgets: Widget[] }>()
    private currentScanResult: {
        nearbyWidget: Widget | null
        snappedPoint: { x: number; y: number } | null
        snappedPointIndex: number
    } | null = null

    constructor(engine: Engine) {
        this.engine = engine
    }

    start(_data: CanvasMouseEvent, shape: Line, pointIndex: number) {
        this.shape = shape
        this.pointIndex = pointIndex
        this.initialHeadBinding = shape.headBinding
        this.initialTailBinding = shape.tailBinding

        const editTable: EditTable = new Map()
        editTable.set(shape, ['points', 'resize'])
        const { transactionId } = this.engine.transactionHandler.begin(
            'continuous',
            {
                editTable,
            },
        )
        this.transactionId = transactionId

        this.reshapeStarted.dispatch({ widgets: [shape] })
    }

    handle(data: CanvasMouseEvent): boolean {
        if (!this.shape || this.pointIndex === -1) return false

        const pointer = data.pointer
        const absolutePoints = [...this.shape.absolutePoints]

        let targetX = pointer.x
        let targetY = pointer.y

        // if head or tail point is being dragged, check for magnetic snapping
        if (
            this.pointIndex === 0 ||
            this.pointIndex === absolutePoints.length - 1
        ) {
            // check for magnetic snapping
            const magnetService =
                this.engine.getService<MagnetService>('magnet')
            const magnetLayer =
                this.engine.stage.nonCanvasDynamicContainer.magnetLayer

            const scanResult = magnetService.scan(
                { x: pointer.x, y: pointer.y },
                50,
                20,
                this.shape.uuid,
            )
            const { nearbyWidget, snappedPoint, snappedPointIndex } = scanResult

            if (snappedPoint) {
                targetX = snappedPoint.x
                targetY = snappedPoint.y
            }
            this.currentScanResult = scanResult

            magnetLayer.update(nearbyWidget, snappedPointIndex)
        }

        if (this.pointIndex >= 0 && this.pointIndex < absolutePoints.length) {
            absolutePoints[this.pointIndex] = [targetX, targetY]
            this.shape.updateFromAbsolutePoints(
                absolutePoints as [number, number][],
            )

            if (this.transactionId) {
                this.engine.transactionHandler.update(this.transactionId)
            }

            this.engine.canvas.requestRender()
            return true
        }
        return false
    }

    end(_data: CanvasMouseEvent) {
        if (!this.shape) return

        if (this.shape) {
            // handle binding logic
            const points = this.shape.points
            let isHead = false
            let isTail = false

            if (this.pointIndex === 0) {
                isTail = true
            } else if (this.pointIndex === points.length - 1) {
                isHead = true
            }

            if (isHead || isTail) {
                const scanResult = this.currentScanResult

                if (
                    scanResult &&
                    scanResult.nearbyWidget &&
                    scanResult.nearbyWidget.canSnap()
                ) {
                    const widget = scanResult.nearbyWidget
                    let rx = 0
                    let ry = 0

                    // use snapped point if available
                    if (scanResult.snappedPoint) {
                        const { rx: newRx, ry: newRy } =
                            widget.getRelativeFromPoint(
                                scanResult.snappedPoint.x,
                                scanResult.snappedPoint.y,
                            )
                        rx = newRx
                        ry = newRy
                    } else {
                        // else get attached point
                        const absPoints = this.shape.absolutePoints
                        const movedPoint = absPoints[this.pointIndex]

                        const { rx: newRx, ry: newRy } =
                            widget.getRelativeFromPoint(
                                movedPoint[0],
                                movedPoint[1],
                            )
                        rx = newRx
                        ry = newRy
                    }

                    if (isHead) {
                        // clear old binding first
                        if (
                            this.shape.headBindingWidget &&
                            this.shape.headBindingWidget !== widget
                        ) {
                            this.shape.headBindingWidget.removeAttachedLine(
                                this.shape,
                            )
                        }
                        this.shape.headBinding = {
                            id: widget.uuid!,
                            rx,
                            ry,
                        }
                        this.shape.headBindingWidget = widget
                        widget.addAttachedLine(this.shape)
                    } else {
                        // clear old binding first
                        if (
                            this.shape.tailBindingWidget &&
                            this.shape.tailBindingWidget !== widget
                        ) {
                            this.shape.tailBindingWidget.removeAttachedLine(
                                this.shape,
                            )
                        }
                        this.shape.tailBinding = {
                            id: widget.uuid!,
                            rx,
                            ry,
                        }
                        this.shape.tailBindingWidget = widget
                        widget.addAttachedLine(this.shape)
                    }
                } else {
                    // moved away from magnet -> unbind
                    if (isHead) {
                        if (this.shape.headBindingWidget) {
                            this.shape.headBindingWidget.removeAttachedLine(
                                this.shape,
                            )
                            this.shape.headBindingWidget = null
                        }
                        this.shape.headBinding = null
                    } else {
                        if (this.shape.tailBindingWidget) {
                            this.shape.tailBindingWidget.removeAttachedLine(
                                this.shape,
                            )
                            this.shape.tailBindingWidget = null
                        }
                        this.shape.tailBinding = null
                    }
                }
            }

            // check for binding changes and update existing transaction
            if (this.transactionId) {
                if (
                    this.shape.headBinding !== this.initialHeadBinding ||
                    this.shape.tailBinding !== this.initialTailBinding
                ) {
                    const initialBindingState = {} as any
                    const props: any = {}

                    if (this.shape.headBinding !== this.initialHeadBinding) {
                        props.headBinding = this.initialHeadBinding ?? null
                    }
                    if (this.shape.tailBinding !== this.initialTailBinding) {
                        props.tailBinding = this.initialTailBinding ?? null
                    }

                    initialBindingState.properties = props

                    this.engine.transactionHandler.addEditingMethod(
                        this.transactionId,
                        this.shape,
                        'lineBinding',
                        initialBindingState,
                    )
                }
                this.engine.transactionHandler.commit(this.transactionId)
                this.transactionId = null
            }

            this.reshapeFinished.dispatch({ widgets: [this.shape] })
        }

        this.shape = null
        this.pointIndex = -1
        this.currentScanResult = null
        this.initialHeadBinding = null
        this.initialTailBinding = null
        this.engine.stage.nonCanvasDynamicContainer.magnetLayer.update(null)
        this.engine.canvas.requestRender()
    }
}
