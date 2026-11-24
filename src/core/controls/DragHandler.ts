import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import { Point } from '@/core/canvas/Canvas'
import { Signal } from '@/core/signal/Signal'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '@/core/transaction/State'
import { Line } from '../shapes/line/Line'
import { snap } from '../canvas/grid'

export class DragHandler {
    private engine: Engine
    private movingObjectState: {
        movingShape: Widget[]
        isObjectMoved: boolean
        isObjectAlreadySelected: boolean
        initialPointer: Point
        initialWidgetPositions: { left: number; top: number }[]
        // top left of all the moving widgets, the point snapped to the grid
        initialCorner: Point
        lines: Set<string>
    } = {
        movingShape: [],
        isObjectMoved: false,
        isObjectAlreadySelected: false,
        initialPointer: { x: 0, y: 0 },
        initialWidgetPositions: [],
        initialCorner: { x: 0, y: 0 },
        lines: new Set(),
    }

    // signals for move
    moveStarted = new Signal<{ widgets: Widget[] }>()
    moveFinished = new Signal<{ widgets: Widget[] }>()

    // signals for temp move. means when the shape is moved without selecting it
    tempMoveStarted = new Signal<{ widget: Widget }>()
    tempMoveFinished = new Signal<{ widget: Widget }>()

    private _handled: boolean = false
    private transactionHandler: TransactionHandler
    private _transactionId: TransactionId | null = null
    private editTable: Map<Widget, EditingMethods[]>

    constructor(engine: Engine) {
        this.engine = engine
        this.transactionHandler = this.engine.transactionHandler
    }

    start(data: CanvasMouseEvent, widgets: Widget[]) {
        this.clearMovingObjectState()

        // handle initial data
        this._handled = false
        this.movingObjectState.movingShape = widgets

        this.movingObjectState.initialPointer = {
            x: data.pointer.x,
            y: data.pointer.y,
        }
        this.movingObjectState.initialWidgetPositions =
            this.movingObjectState.movingShape.map((widget) => ({
                left: widget.left,
                top: widget.top,
            }))
        const positions = this.movingObjectState.initialWidgetPositions
        this.movingObjectState.initialCorner = {
            x: Math.min(...positions.map((p) => p.left)),
            y: Math.min(...positions.map((p) => p.top)),
        }

        // if starting with one widget and it is not selected
        if (widgets.length === 1 && !!widgets[0].selected) {
            this.movingObjectState.isObjectAlreadySelected = true
        } else if (widgets.length > 1) {
            // if there are multiple widgets, they should be already selected
            this.movingObjectState.isObjectAlreadySelected = true
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        widgets.forEach((widget) => {
            editTable.set(widget, ['move'])
            if (widget instanceof Line) {
                this.movingObjectState.lines.add(widget.uuid!)
            }
        })
        this.editTable = editTable
    }

    handle(data: CanvasMouseEvent) {
        // drag handler
        let deltaX = data.pointer.x - this.movingObjectState.initialPointer.x
        let deltaY = data.pointer.y - this.movingObjectState.initialPointer.y

        if (this.engine.settings.isGridSnapEnabled) {
            const { x, y } = this.movingObjectState.initialCorner
            deltaX = snap(x + deltaX) - x
            deltaY = snap(y + deltaY) - y
        }

        // apply new positions
        this.movingObjectState.movingShape.forEach((widget, index) => {
            const initialPos =
                this.movingObjectState.initialWidgetPositions[index]
            widget.move(initialPos.left + deltaX, initialPos.top + deltaY, {
                lines: this.movingObjectState.lines,
            })
        })

        // render canvas
        this.engine.canvas.requestRender()

        // if this is a temp move, send signals
        if (
            this.movingObjectState.movingShape.length === 1 &&
            !this.movingObjectState.isObjectMoved &&
            !this.movingObjectState.isObjectAlreadySelected
        ) {
            this.tempMoveStarted.dispatch({
                widget: this.movingObjectState.movingShape[0],
            })
        }

        // if selected object is moved, dispatch moveStarted
        // in this case, this is not a temp move!
        if (
            this.movingObjectState.movingShape.length > 0 &&
            !this.movingObjectState.isObjectMoved &&
            this.movingObjectState.isObjectAlreadySelected
        ) {
            this.moveStarted.dispatch({
                widgets: this.movingObjectState.movingShape,
            })
        }

        this.movingObjectState.isObjectMoved = true
        this._handled = true

        if (!this._transactionId && this.editTable.size > 0) {
            const { transactionId } = this.transactionHandler.begin(
                'continuous',
                {
                    editTable: this.editTable,
                },
            )
            this._transactionId = transactionId
            this.transactionHandler.update(this._transactionId)
        } else if (this._transactionId) {
            this.transactionHandler.update(this._transactionId)
        }
    }

    end(_data: CanvasMouseEvent): boolean {
        if (
            this.movingObjectState.isObjectMoved &&
            !this.movingObjectState.isObjectAlreadySelected
        ) {
            this.tempMoveFinished.dispatch({
                widget: this.movingObjectState.movingShape[0],
            })
            this.engine.canvas.requestRender()
        } else if (this.movingObjectState.isObjectMoved) {
            // if selected object is moved, dispatch moveFinished
            this.moveFinished.dispatch({
                widgets: this.movingObjectState.movingShape,
            })
        }
        if (this._transactionId) {
            this.transactionHandler.commit(this._transactionId)
            this._transactionId = null
        }
        return this._handled
    }

    private clearMovingObjectState() {
        this.movingObjectState.lines.clear()
        this.movingObjectState = {
            movingShape: [],
            isObjectMoved: false,
            isObjectAlreadySelected: false,
            initialPointer: { x: 0, y: 0 },
            initialWidgetPositions: [],
            initialCorner: { x: 0, y: 0 },
            lines: this.movingObjectState.lines,
        }
    }
}
