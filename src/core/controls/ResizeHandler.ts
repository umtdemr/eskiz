import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '../transaction/State'

export enum ResizePosition {
    EDGE_LEFT,
    EDGE_TOP,
    EDGE_RIGHT,
    EDGE_BOTTOM,
    CORNER_TOP_LEFT,
    CORNER_TOP_RIGHT,
    CORNER_BOTTOM_LEFT,
    CORNER_BOTTOM_RIGHT,
}

/*
 * Handles resizing from corners or edges.
 */
export class ResizeHandler {
    private engine: Engine
    private initialBounds = {
        pointerX: 0,
        pointerY: 0,
        widgetX: 0,
        widgetY: 0,
        width: 0,
        height: 0,
        aspectRatio: 1,
    }
    private transactionHandler: TransactionHandler
    private _transactionId: TransactionId
    private position: ResizePosition
    private shape: Widget
    private resizer: 'edge' | 'corner'
    private _shiftDominantAxis: 'x' | 'y' | undefined // for corner resize

    constructor(engine: Engine) {
        this.engine = engine
        this.transactionHandler = engine.transactionHandler
    }

    start(data: CanvasMouseEvent, shape: Widget, position: ResizePosition) {
        this.initialBounds = {
            pointerX: data.pointer.x,
            pointerY: data.pointer.y,
            widgetX: shape.left,
            widgetY: shape.top,
            width: shape.width,
            height: shape.height,
            aspectRatio: shape.width / shape.height,
        }

        this.position = position
        this.shape = shape

        if (
            this.position === ResizePosition.EDGE_LEFT ||
            this.position === ResizePosition.EDGE_TOP ||
            this.position === ResizePosition.EDGE_RIGHT ||
            this.position === ResizePosition.EDGE_BOTTOM
        ) {
            this.resizer = 'edge'
        } else {
            this.resizer = 'corner'
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        editTable.set(this.shape, ['resize'])
        const { transactionId } = this.transactionHandler.begin('continuous', {
            editTable,
        })
        this._transactionId = transactionId
    }

    handle(data: CanvasMouseEvent): boolean {
        if (this.resizer === 'edge' && this.resizeFromEdge(data)) {
            if (this._transactionId) {
                this.transactionHandler.update(this._transactionId)
            }
            return true
        } else if (this.resizer === 'corner' && this.resizeFromCorner(data)) {
            if (this._transactionId) {
                this.transactionHandler.update(this._transactionId)
            }
            return true
        }
        return false
    }

    end(data: CanvasMouseEvent) {
        if (this._transactionId) {
            this.transactionHandler.commit(this._transactionId)
        }
    }

    private resizeFromEdge(data: CanvasMouseEvent): boolean {
        const deltaX = data.pointer.x - this.initialBounds.pointerX
        const deltaY = data.pointer.y - this.initialBounds.pointerY

        let isUpdated = true
        switch (this.position) {
            case ResizePosition.EDGE_LEFT:
                // with shift
                if (data.e.shiftKey) {
                    this.shape.width = this.initialBounds.width - deltaX * 2
                    this.shape.left = this.initialBounds.widgetX + deltaX
                } else {
                    // standard
                    this.shape.width = this.initialBounds.width - deltaX
                    this.shape.left = this.initialBounds.widgetX + deltaX
                }
                break
            case ResizePosition.EDGE_RIGHT:
                // with shift
                if (data.e.shiftKey) {
                    this.shape.width = this.initialBounds.width + deltaX * 2
                    this.shape.left = this.initialBounds.widgetX - deltaX
                } else {
                    // standard
                    this.shape.width = this.initialBounds.width + deltaX
                }
                break
            case ResizePosition.EDGE_TOP:
                // with shift
                if (data.e.shiftKey) {
                    this.shape.height = this.initialBounds.height - deltaY * 2
                    this.shape.top = this.initialBounds.widgetY + deltaY
                } else {
                    // standard
                    this.shape.height = this.initialBounds.height - deltaY
                    this.shape.top = this.initialBounds.widgetY + deltaY
                }
                break
            case ResizePosition.EDGE_BOTTOM:
                // with shift
                if (data.e.shiftKey) {
                    this.shape.height = this.initialBounds.height + deltaY * 2
                    this.shape.top = this.initialBounds.widgetY - deltaY
                } else {
                    // standard
                    this.shape.height = this.initialBounds.height + deltaY
                }
                break
            default:
                isUpdated = false
                break
        }
        return isUpdated
    }

    private resizeFromCorner(data: CanvasMouseEvent): boolean {
        this.shape.width =
            this.initialBounds.width +
            data.pointer.x -
            this.initialBounds.pointerX
        this.shape.height =
            this.initialBounds.height +
            data.pointer.y -
            this.initialBounds.pointerY

        let deltaX = data.pointer.x - this.initialBounds.pointerX
        let deltaY = data.pointer.y - this.initialBounds.pointerY
        const initial = this.initialBounds

        // if shift is pressed, need to scale equally
        if (data.e.shiftKey && initial.aspectRatio) {
            // determine the dominant axis
            if (!this._shiftDominantAxis) {
                if (
                    Math.abs(deltaX) / initial.width >
                    Math.abs(deltaY) / initial.height
                ) {
                    this._shiftDominantAxis = 'x'
                } else {
                    this._shiftDominantAxis = 'y'
                }
            }

            const isDiagonalFlip =
                this.position === ResizePosition.CORNER_TOP_RIGHT ||
                this.position === ResizePosition.CORNER_BOTTOM_LEFT

            if (this._shiftDominantAxis === 'x') {
                const lockedY = deltaX / initial.aspectRatio
                deltaY = isDiagonalFlip ? -lockedY : lockedY
            } else {
                const lockedX = deltaY * initial.aspectRatio
                deltaX = isDiagonalFlip ? -lockedX : lockedX
            }
        }

        let isUpdated = true
        switch (this.position) {
            case ResizePosition.CORNER_BOTTOM_RIGHT:
                this.shape.width = initial.width + deltaX
                this.shape.height = initial.height + deltaY
                break

            case ResizePosition.CORNER_BOTTOM_LEFT: // Bottom-Left: Anchor is Top-Right
                this.shape.width = initial.width - deltaX
                this.shape.height = initial.height + deltaY
                this.shape.left = initial.widgetX + deltaX
                break

            case ResizePosition.CORNER_TOP_RIGHT:
                this.shape.width = initial.width + deltaX
                this.shape.height = initial.height - deltaY
                this.shape.top = initial.widgetY + deltaY
                break

            case ResizePosition.CORNER_TOP_LEFT: // Top-Left: Anchor is Bottom-Right
                this.shape.width = initial.width - deltaX
                this.shape.height = initial.height - deltaY
                this.shape.left = initial.widgetX + deltaX
                this.shape.top = initial.widgetY + deltaY
                break
            default:
                isUpdated = false
                break
        }

        return isUpdated
    }
}
