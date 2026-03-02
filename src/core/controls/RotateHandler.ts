import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '../transaction/State'
import { Signal } from '../signal/Signal'

const SNAP_ANGLE = 15

export class RotateHandler {
    private engine: Engine
    private transactionHandler: TransactionHandler
    private _transactionId: TransactionId | null = null
    private shape: Widget
    private initialPointerAngle = 0
    private initialWidgetAngle = 0
    private _isRotated = false

    rotateStarted = new Signal<{ widgets: Widget[] }>()
    rotateFinished = new Signal<{ widgets: Widget[] }>()

    constructor(engine: Engine) {
        this.engine = engine
        this.transactionHandler = engine.transactionHandler
    }

    start(data: CanvasMouseEvent, shape: Widget) {
        this.shape = shape
        this.initialWidgetAngle = shape.angle || 0

        const cx = shape.centerX
        const cy = shape.centerY
        this.initialPointerAngle = Math.atan2(
            data.pointer.y - cy,
            data.pointer.x - cx,
        )

        const editTable = new Map<Widget, EditingMethods[]>()
        editTable.set(shape, ['rotate'])
        const { transactionId } = this.transactionHandler.begin('continuous', {
            editTable,
        })
        this._transactionId = transactionId
    }

    handle(data: CanvasMouseEvent): boolean {
        const cx = this.shape.centerX
        const cy = this.shape.centerY

        const currentPointerAngle = Math.atan2(
            data.pointer.y - cy,
            data.pointer.x - cx,
        )

        let angleDiff = currentPointerAngle - this.initialPointerAngle
        // convert to degrees
        angleDiff = (angleDiff * 180) / Math.PI

        let newAngle = this.initialWidgetAngle + angleDiff

        // handle shift snapping
        if (data.e.shiftKey) {
            newAngle = Math.round(newAngle / SNAP_ANGLE) * SNAP_ANGLE
        }

        // normalize to 0-359
        newAngle = ((newAngle % 360) + 360) % 360

        // if there's an actual change
        if (this.shape.angle !== newAngle) {
            this.shape.rotate(newAngle)

            if (this._transactionId) {
                this.transactionHandler.update(this._transactionId)
            }
            if (!this._isRotated) {
                this.rotateStarted.dispatch({ widgets: [this.shape] })
            }
            this._isRotated = true
            this.engine.canvas.requestRender()
            return true
        }

        return false
    }

    end(_data: CanvasMouseEvent) {
        if (this._transactionId) {
            this.transactionHandler.commit(this._transactionId)
            this._transactionId = null
        }
        if (this._isRotated) {
            this.rotateFinished.dispatch({ widgets: [this.shape] })
            this._isRotated = false
        }
    }
}
