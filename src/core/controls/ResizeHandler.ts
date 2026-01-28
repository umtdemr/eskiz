import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Widget } from '@/core/shapes/Widget'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '../transaction/State'
import { Signal } from '../signal/Signal'
import { WidgetType } from '@/core/constants.ts'

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
        fontSize: 0,
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
        this.engine = engine
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
            fontSize: (shape as any).fontSize || 0,
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

    end(data: CanvasMouseEvent) {
        if (this._transactionId) {
            this.transactionHandler.commit(this._transactionId)
        }
        if (this._isResized) {
            this.resizeFinished.dispatch({ widgets: [this.shape] })
            this._isResized = false
        }
    }

    private resizeFromEdge(data: CanvasMouseEvent): boolean {
        const deltaX = data.pointer.x - this.initialBounds.pointerX
        const deltaY = data.pointer.y - this.initialBounds.pointerY

        let isUpdated = true

        // Special handling for text widgets - prevent width from going below minimum
        let minWidth = ResizeHandler.MIN_DIMENSION
        const isTextWidget = this.shape.widgetType === WidgetType.TEXTBOX
        if (isTextWidget && (this.shape as any).getMinWidth) {
            minWidth = Math.max(minWidth, (this.shape as any).getMinWidth())
        }

        switch (this.position) {
            case ResizePosition.EDGE_LEFT:
                // with shift
                if (data.e.shiftKey) {
                    const newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width - deltaX * 2,
                    )
                    const actualDelta =
                        (this.initialBounds.width - newWidth) / 2
                    this.shape.resize({
                        width: newWidth,
                        left: this.initialBounds.widgetX + actualDelta,
                    })
                } else {
                    // standard
                    const newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width - deltaX,
                    )
                    const actualDelta = this.initialBounds.width - newWidth
                    this.shape.resize({
                        width: newWidth,
                        left: this.initialBounds.widgetX + actualDelta,
                    })
                }
                if (
                    isTextWidget &&
                    (this.shape as any).createOrUpdateParagraph
                ) {
                    ;(this.shape as any).createOrUpdateParagraph()
                }
                break
            case ResizePosition.EDGE_RIGHT:
                // with shift
                if (data.e.shiftKey) {
                    const newWidth = Math.max(
                        minWidth,
                        this.initialBounds.width + deltaX * 2,
                    )
                    const actualDelta =
                        (newWidth - this.initialBounds.width) / 2
                    this.shape.resize({
                        width: newWidth,
                        left: this.initialBounds.widgetX - actualDelta,
                    })
                } else {
                    // standard
                    this.shape.resize({
                        width: Math.max(
                            minWidth,
                            this.initialBounds.width + deltaX,
                        ),
                    })
                }
                if (
                    isTextWidget &&
                    (this.shape as any).createOrUpdateParagraph
                ) {
                    ;(this.shape as any).createOrUpdateParagraph()
                }
                break
            case ResizePosition.EDGE_TOP:
                // For text widgets, don't allow height resize (height is determined by content)
                if (isTextWidget) {
                    isUpdated = false
                    break
                }
                // with shift
                if (data.e.shiftKey) {
                    const newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height - deltaY * 2,
                    )
                    const actualDelta =
                        (this.initialBounds.height - newHeight) / 2
                    this.shape.resize({
                        height: newHeight,
                        top: this.initialBounds.widgetY + actualDelta,
                    })
                } else {
                    // standard
                    const newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height - deltaY,
                    )
                    const actualDelta = this.initialBounds.height - newHeight
                    this.shape.resize({
                        height: newHeight,
                        top: this.initialBounds.widgetY + actualDelta,
                    })
                }
                break
            case ResizePosition.EDGE_BOTTOM:
                // For text widgets, don't allow height resize (height is determined by content)
                if (isTextWidget) {
                    isUpdated = false
                    break
                }
                // with shift
                if (data.e.shiftKey) {
                    const newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        this.initialBounds.height + deltaY * 2,
                    )
                    const actualDelta =
                        (newHeight - this.initialBounds.height) / 2
                    this.shape.resize({
                        height: newHeight,
                        top: this.initialBounds.widgetY - actualDelta,
                    })
                } else {
                    // standard
                    this.shape.resize({
                        height: Math.max(
                            ResizeHandler.MIN_DIMENSION,
                            this.initialBounds.height + deltaY,
                        ),
                    })
                }
                break
            default:
                isUpdated = false
                break
        }
        return isUpdated
    }

    private resizeFromCorner(data: CanvasMouseEvent): boolean {
        let deltaX = data.pointer.x - this.initialBounds.pointerX
        let deltaY = data.pointer.y - this.initialBounds.pointerY
        const initial = this.initialBounds

        // Special handling for text widgets - scale font size AND resize
        if (this.shape.widgetType === WidgetType.TEXTBOX) {
            // Calculate scale factor based on diagonal distance change
            const initialDiagonal = Math.sqrt(
                initial.width ** 2 + initial.height ** 2,
            )

            // Calculate current diagonal based on the corner being dragged
            let currentWidth = initial.width
            let currentHeight = initial.height

            // Determine new dimensions based on corner
            if (this.position === ResizePosition.CORNER_BOTTOM_RIGHT) {
                currentWidth = initial.width + deltaX
                currentHeight = initial.height + deltaY
            } else if (this.position === ResizePosition.CORNER_BOTTOM_LEFT) {
                currentWidth = initial.width - deltaX
                currentHeight = initial.height + deltaY
            } else if (this.position === ResizePosition.CORNER_TOP_RIGHT) {
                currentWidth = initial.width + deltaX
                currentHeight = initial.height - deltaY
            } else if (this.position === ResizePosition.CORNER_TOP_LEFT) {
                currentWidth = initial.width - deltaX
                currentHeight = initial.height - deltaY
            }

            const currentDiagonal = Math.sqrt(
                currentWidth ** 2 + currentHeight ** 2,
            )

            const scaleFactor = currentDiagonal / initialDiagonal
            const newFontSize = Math.max(
                1,
                Math.round(initial.fontSize * scaleFactor),
            )

            // Apply font size change
            if ((this.shape as any).changeFontSize) {
                ;(this.shape as any).changeFontSize(newFontSize)
            }

            // Now we need to resize the box to match the new scale
            const newWidth = Math.max(
                ResizeHandler.MIN_DIMENSION,
                initial.width * scaleFactor,
            )

            // Apply the resize with correct anchor logic
            switch (this.position) {
                case ResizePosition.CORNER_BOTTOM_RIGHT:
                    this.shape.resize({
                        width: newWidth,
                    })
                    break
                case ResizePosition.CORNER_BOTTOM_LEFT:
                    this.shape.resize({
                        width: newWidth,
                        left: initial.widgetX + (initial.width - newWidth),
                    })
                    break
                case ResizePosition.CORNER_TOP_RIGHT:
                    this.shape.resize({
                        width: newWidth,
                        top: initial.widgetY, // Top stays same, height auto-adjusts
                    })
                    break
                case ResizePosition.CORNER_TOP_LEFT:
                    this.shape.resize({
                        width: newWidth,
                        left: initial.widgetX + (initial.width - newWidth),
                        top: initial.widgetY, // We'll adjust top after height calculation
                    })
                    break
            }

            // Re-create paragraph to apply new dimensions and get correct height
            if ((this.shape as any).createOrUpdateParagraph) {
                ;(this.shape as any).createOrUpdateParagraph()
            }

            // If anchoring to bottom (Top corners), we need to adjust top position based on new height
            if (
                this.position === ResizePosition.CORNER_TOP_RIGHT ||
                this.position === ResizePosition.CORNER_TOP_LEFT
            ) {
                const newHeight = this.shape.height
                const heightDiff = newHeight - initial.height
                this.shape.resize({
                    top: initial.widgetY - heightDiff,
                })
            }

            return true
        }

        // if shift is pressed, need to scale equally
        // for images, we always want to scale equally
        const shouldLockAspectRatio =
            (data.e.shiftKey || this.shape.widgetType === WidgetType.IMAGE) &&
            initial.aspectRatio

        if (shouldLockAspectRatio) {
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
                this.shape.resize({
                    width: Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.width + deltaX,
                    ),
                    height: Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.height + deltaY,
                    ),
                })
                break

            case ResizePosition.CORNER_BOTTOM_LEFT: // Bottom-Left: Anchor is Top-Right
                {
                    const newWidth = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.width - deltaX,
                    )
                    const actualDeltaX = initial.width - newWidth
                    this.shape.resize({
                        width: newWidth,
                        height: Math.max(
                            ResizeHandler.MIN_DIMENSION,
                            initial.height + deltaY,
                        ),
                        left: initial.widgetX + actualDeltaX,
                    })
                }
                break

            case ResizePosition.CORNER_TOP_RIGHT:
                {
                    const newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.height - deltaY,
                    )
                    const actualDeltaY = initial.height - newHeight
                    this.shape.resize({
                        width: Math.max(
                            ResizeHandler.MIN_DIMENSION,
                            initial.width + deltaX,
                        ),
                        height: newHeight,
                        top: initial.widgetY + actualDeltaY,
                    })
                }
                break

            case ResizePosition.CORNER_TOP_LEFT: // Top-Left: Anchor is Bottom-Right
                {
                    const newWidth = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.width - deltaX,
                    )
                    const newHeight = Math.max(
                        ResizeHandler.MIN_DIMENSION,
                        initial.height - deltaY,
                    )
                    const actualDeltaX = initial.width - newWidth
                    const actualDeltaY = initial.height - newHeight
                    this.shape.resize({
                        width: newWidth,
                        height: newHeight,
                        left: initial.widgetX + actualDeltaX,
                        top: initial.widgetY + actualDeltaY,
                    })
                }
                break
            default:
                isUpdated = false
                break
        }

        return isUpdated
    }
}
