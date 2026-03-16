import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '../transaction/State'
import { Signal } from '../signal/Signal'
import { WidgetType } from '@/core/constants.ts'
import { rotatePoint, reverseRotatePoint } from '@/core/geometry/math'

interface ResizableTextWidget extends Widget {
    fontSize: number
    scale?: number
    getMinWidth?: () => number
    changeFontSize?: (size: number) => boolean
    changeScale?: (scale: number) => boolean
}

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

function calculateResizedBounds(
    initialLeft: number,
    initialTop: number,
    initialWidth: number,
    initialHeight: number,
    newWidth: number,
    newHeight: number,
    angleDegrees: number,
    anchorRx: number,
    anchorRy: number,
): { left: number; top: number } {
    if (angleDegrees === 0 || !angleDegrees) {
        const left =
            initialLeft + ((anchorRx + 1) / 2) * (initialWidth - newWidth)
        const top =
            initialTop + ((anchorRy + 1) / 2) * (initialHeight - newHeight)
        return { left, top }
    }

    const initialCx = initialLeft + initialWidth / 2
    const initialCy = initialTop + initialHeight / 2
    const initialLocalAnchorX = initialCx + anchorRx * (initialWidth / 2)
    const initialLocalAnchorY = initialCy + anchorRy * (initialHeight / 2)

    const globalAnchor = rotatePoint(
        initialLocalAnchorX,
        initialLocalAnchorY,
        initialCx,
        initialCy,
        angleDegrees,
    )

    const localAnchorVecX = anchorRx * (newWidth / 2)
    const localAnchorVecY = anchorRy * (newHeight / 2)

    const rotAnchorVec = rotatePoint(
        localAnchorVecX,
        localAnchorVecY,
        0,
        0,
        angleDegrees,
    )

    const newCx = globalAnchor.x - rotAnchorVec.x
    const newCy = globalAnchor.y - rotAnchorVec.y

    return {
        left: newCx - newWidth / 2,
        top: newCy - newHeight / 2,
    }
}

/*
 * Handles resizing from corners or edges.
 */
export class ResizeHandler {
    private initialBounds = {
        pointerX: 0,
        pointerY: 0,
        widgetX: 0,
        widgetY: 0,
        width: 0,
        height: 0,
        aspectRatio: 1,
        angle: 0,
        fontSize: 16,
        scale: 1,
    }
    private transactionHandler: TransactionHandler
    private _transactionId: TransactionId
    private position: ResizePosition
    private shape: Widget
    private resizer: 'edge' | 'corner'
    private _shiftDominantAxis: 'x' | 'y' | undefined // for corner resize
    private _isResized = false
    private static readonly MIN_DIMENSION = 1 // Minimum width/height in pixels

    constructor(engine: Engine) {
        this.transactionHandler = engine.transactionHandler
    }

    resizeStarted = new Signal<{ widgets: Widget[] }>()
    resizeFinished = new Signal<{ widgets: Widget[] }>()

    start(data: CanvasMouseEvent, shape: Widget, position: ResizePosition) {
        this.initialBounds = {
            pointerX: data.pointer.x,
            pointerY: data.pointer.y,
            widgetX: shape.left,
            widgetY: shape.top,
            width: shape.width,
            height: shape.height,
            aspectRatio: shape.width / shape.height,
            angle: shape.angle,
            fontSize: (shape as ResizableTextWidget).fontSize || 14,
            scale: (shape as ResizableTextWidget).scale || 1,
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
            if (!this._isResized) {
                this.resizeStarted.dispatch({ widgets: [this.shape] })
            }
            this._isResized = true
            return true
        } else if (this.resizer === 'corner' && this.resizeFromCorner(data)) {
            if (this._transactionId) {
                this.transactionHandler.update(this._transactionId)
            }
            if (!this._isResized) {
                this.resizeStarted.dispatch({ widgets: [this.shape] })
            }
            this._isResized = true
            return true
        }
        return false
    }

    end(_data: CanvasMouseEvent) {
        if (this._transactionId) {
            this.transactionHandler.commit(this._transactionId)
        }
        if (this._isResized) {
            this.resizeFinished.dispatch({ widgets: [this.shape] })
            this._isResized = false
        }
    }

    private resizeFromEdge(data: CanvasMouseEvent): boolean {
        let deltaX = data.pointer.x - this.initialBounds.pointerX
        let deltaY = data.pointer.y - this.initialBounds.pointerY

        if (this.shape.angle !== 0) {
            const rot = reverseRotatePoint(
                deltaX,
                deltaY,
                0,
                0,
                this.shape.angle,
            )
            deltaX = rot.x
            deltaY = rot.y
        }

        let isUpdated = true

        // Special handling for text widgets - prevent width from going below minimum
        let minWidth = ResizeHandler.MIN_DIMENSION
        const isTextWidget = this.shape.widgetType === WidgetType.TEXTBOX
        const textWidget = this.shape as ResizableTextWidget
        if (isTextWidget && textWidget.getMinWidth) {
            minWidth = Math.max(minWidth, textWidget.getMinWidth())
        }

        let newWidth = this.initialBounds.width
        let newHeight = this.initialBounds.height
        let anchorRx = 0
        let anchorRy = 0

        switch (this.position) {
            case ResizePosition.EDGE_LEFT:
                if (data.e.shiftKey) {
                    newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width - deltaX * 2,
                    )
                    anchorRx = 0
                } else {
                    newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width - deltaX,
                    )
                    anchorRx = 1
                }
                break
            case ResizePosition.EDGE_RIGHT:
                if (data.e.shiftKey) {
                    newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width + deltaX * 2,
                    )
                    anchorRx = 0
                } else {
                    newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width + deltaX,
                    )
                    anchorRx = -1
                }
                break
            case ResizePosition.EDGE_TOP:
                if (isTextWidget) {
                    isUpdated = false
                    break
                }
                if (data.e.shiftKey) {
                    newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height - deltaY * 2,
                    )
                    anchorRy = 0
                } else {
                    newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height - deltaY,
                    )
                    anchorRy = 1
                }
                break
            case ResizePosition.EDGE_BOTTOM:
                if (isTextWidget) {
                    isUpdated = false
                    break
                }
                if (data.e.shiftKey) {
                    newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height + deltaY * 2,
                    )
                    anchorRy = 0
                } else {
                    newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height + deltaY,
                    )
                    anchorRy = -1
                }
                break
            default:
                isUpdated = false
                break
        }

        if (isUpdated) {
            const bounds = calculateResizedBounds(
                this.initialBounds.widgetX,
                this.initialBounds.widgetY,
                this.initialBounds.width,
                this.initialBounds.height,
                newWidth,
                newHeight,
                this.shape.angle,
                anchorRx,
                anchorRy,
            )

            this.shape.resize({
                width: newWidth,
                height: newHeight,
                left: bounds.left,
                top: bounds.top,
            })
        }
        return isUpdated
    }

    private resizeFromCorner(data: CanvasMouseEvent): boolean {
        let deltaX = data.pointer.x - this.initialBounds.pointerX
        let deltaY = data.pointer.y - this.initialBounds.pointerY
        const initial = this.initialBounds

        if (this.shape.angle !== 0) {
            const rot = reverseRotatePoint(
                deltaX,
                deltaY,
                0,
                0,
                this.shape.angle,
            )
            deltaX = rot.x
            deltaY = rot.y
        }

        // Special handling for text widgets - scale font size AND resize
        if (this.shape.widgetType === WidgetType.TEXTBOX) {
            const resizableText = this.shape as ResizableTextWidget
            const initialDiagonal =
                Math.sqrt(initial.width ** 2 + initial.height ** 2) *
                (resizableText.scale ?? 1)

            let currentWidth = initial.width
            let currentHeight = initial.height
            let anchorRx = 0
            let anchorRy = 0

            if (this.position === ResizePosition.CORNER_BOTTOM_RIGHT) {
                currentWidth = initial.width + deltaX
                currentHeight = initial.height + deltaY
                anchorRx = -1
                anchorRy = -1
            } else if (this.position === ResizePosition.CORNER_BOTTOM_LEFT) {
                currentWidth = initial.width - deltaX
                currentHeight = initial.height + deltaY
                anchorRx = 1
                anchorRy = -1
            } else if (this.position === ResizePosition.CORNER_TOP_RIGHT) {
                currentWidth = initial.width + deltaX
                currentHeight = initial.height - deltaY
                anchorRx = -1
                anchorRy = 1
            } else if (this.position === ResizePosition.CORNER_TOP_LEFT) {
                currentWidth = initial.width - deltaX
                currentHeight = initial.height - deltaY
                anchorRx = 1
                anchorRy = 1
            }

            const currentDiagonal =
                Math.sqrt(currentWidth ** 2 + currentHeight ** 2) *
                (resizableText.scale ?? 1)

            const scaleFactor = currentDiagonal / initialDiagonal

            if (resizableText.changeScale) {
                const newScale = Math.max(0.1, initial.scale * scaleFactor)
                resizableText.changeScale(newScale)
            } else if (resizableText.changeFontSize) {
                const newFontSize = Math.max(
                    1,
                    Math.round(initial.fontSize * scaleFactor),
                )
                resizableText.changeFontSize(newFontSize)
            }

            const newWidth = Math.max(
                ResizeHandler.MIN_DIMENSION,
                initial.width * scaleFactor,
            )

            this.shape.resize({ width: newWidth })

            const newHeight = this.shape.height

            const bounds = calculateResizedBounds(
                initial.widgetX,
                initial.widgetY,
                initial.width,
                initial.height,
                newWidth,
                newHeight,
                this.shape.angle,
                anchorRx,
                anchorRy,
            )

            // apply final dimensions
            this.shape.resize({
                left: bounds.left,
                top: bounds.top,
            })

            return true
        }

        const shouldLockAspectRatio =
            (data.e.shiftKey ||
                this.shape.widgetType === WidgetType.IMAGE ||
                this.shape.widgetType === WidgetType.STICKY_NOTE ||
                this.shape.widgetType === WidgetType.PATH) &&
            initial.aspectRatio

        if (shouldLockAspectRatio) {
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
        let newWidth = initial.width
        let newHeight = initial.height
        let anchorRx = 0
        let anchorRy = 0

        switch (this.position) {
            case ResizePosition.CORNER_BOTTOM_RIGHT:
                newWidth = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.width + deltaX,
                )
                newHeight = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.height + deltaY,
                )
                anchorRx = -1
                anchorRy = -1
                break
            case ResizePosition.CORNER_BOTTOM_LEFT:
                newWidth = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.width - deltaX,
                )
                newHeight = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.height + deltaY,
                )
                anchorRx = 1
                anchorRy = -1
                break
            case ResizePosition.CORNER_TOP_RIGHT:
                newWidth = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.width + deltaX,
                )
                newHeight = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.height - deltaY,
                )
                anchorRx = -1
                anchorRy = 1
                break
            case ResizePosition.CORNER_TOP_LEFT:
                newWidth = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.width - deltaX,
                )
                newHeight = Math.max(
                    ResizeHandler.MIN_DIMENSION,
                    initial.height - deltaY,
                )
                anchorRx = 1
                anchorRy = 1
                break
            default:
                isUpdated = false
                break
        }

        if (isUpdated) {
            const bounds = calculateResizedBounds(
                initial.widgetX,
                initial.widgetY,
                initial.width,
                initial.height,
                newWidth,
                newHeight,
                this.shape.angle,
                anchorRx,
                anchorRy,
            )

            this.shape.resize({
                width: newWidth,
                height: newHeight,
                left: bounds.left,
                top: bounds.top,
            })
        }

        return isUpdated
    }
}
