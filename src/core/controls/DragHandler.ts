import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import { Point } from '@/core/canvas/Canvas'
import { Signal } from '@/core/signal/Signal'

export class DragHandler {
    private engine: Engine
    private movingObjectState: {
        movingShape: Widget[]
        isObjectMoved: boolean
        isObjectAlreadySelected: boolean
        initialPointer: Point
        initialWidgetPositions: { left: number; top: number }[]
    } = {
        movingShape: [],
        isObjectMoved: false,
        isObjectAlreadySelected: false,
        initialPointer: { x: 0, y: 0 },
        initialWidgetPositions: [],
    }

    // signals for move
    moveStarted = new Signal<{ widgets: Widget[] }>()
    moveFinished = new Signal<{ widgets: Widget[] }>()

    // signals for temp move. means when the shape is moved without selecting it
    tempMoveStarted = new Signal<{ widget: Widget }>()
    tempMoveFinished = new Signal<{ widget: Widget }>()

    private _handled: boolean = false

    constructor(engine: Engine) {
        this.engine = engine
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

        // if starting with one widget and it is not selected
        if (widgets.length === 1 && !!widgets[0].selected) {
            this.movingObjectState.isObjectAlreadySelected = true
        } else if (widgets.length > 1) {
            // if there are multiple widgets, they should be already selected
            this.movingObjectState.isObjectAlreadySelected = true
        }
    }

    handle(data: CanvasMouseEvent) {
        // drag handler
        const deltaX = data.pointer.x - this.movingObjectState.initialPointer.x
        const deltaY = data.pointer.y - this.movingObjectState.initialPointer.y

        // apply new positions
        this.movingObjectState.movingShape.forEach((widget, index) => {
            const initialPos =
                this.movingObjectState.initialWidgetPositions[index]
            widget.left = initialPos.left + deltaX
            widget.top = initialPos.top + deltaY
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
    }

    end(data: CanvasMouseEvent): boolean {
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
        return this._handled
    }

    private clearMovingObjectState() {
        this.movingObjectState = {
            movingShape: [],
            isObjectMoved: false,
            isObjectAlreadySelected: false,
            initialPointer: { x: 0, y: 0 },
            initialWidgetPositions: [],
        }
    }
}
