import { ControlProps, Control } from '@/core/shapes/nonCanvasShapes/Control'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas.ts'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine.ts'
import { SelectionService } from '@/core/services/SelectionService.ts'
import {
    CursorService,
    ResizeCursors,
    CursorPriority,
} from '@/core/services/CursorService'
import { Widget } from '@/core/shapes/Widget.ts'
import { CURSOR_OWNERS } from '@/helpers/Constant.ts'
import {
    TransactionHandler,
    TransactionId,
} from '@/core/transaction/TransactionHandler'
import { EditingMethods } from '@/core/transaction/State'

export enum CornerPosition {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
}

export interface CornerControlProps extends ControlProps {
    position: CornerPosition
}

/**
 * CornerControl is a controller for resizing the shape from corners.
 */
export class CornerControl extends Control {
    position: CornerPosition
    private shape: Widget
    private _shiftDominantAxis: 'x' | 'y' | undefined
    private initialBounds = {
        pointerX: 0,
        pointerY: 0,
        widgetX: 0,
        widgetY: 0,
        width: 0,
        height: 0,
        aspectRatio: 1,
    }
    private strokeWidth = 1.5
    private cursorToolName = CURSOR_OWNERS.CORNER_CONTROL
    private cursorService: CursorService
    private transactionHandler: TransactionHandler
    private transactionId: TransactionId | null

    constructor(
        props: CornerControlProps,
        engine: Engine,
        selectionService: SelectionService,
    ) {
        super(props, 'corner', engine, selectionService)
        this.position = props.position
        this.shape = this.selectionService.selected[0]

        this.shape.boundsChanged.add(this.onShapeBoundsChanged, this)
        this.updatePosition()

        this.cursorService = engine.getService<CursorService>('cursor')
        this.transactionHandler = new TransactionHandler(engine.wsEngine)
    }

    private onShapeBoundsChanged() {
        this.updatePosition()
    }

    protected renderContent(renderContext: RenderContext) {
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)

        const w = this.width / renderContext.scale
        const h = this.height / renderContext.scale
        const rect = canvasKit.LTRBRect(0 - w / 2, 0 - h / 2, w / 2, h / 2)

        const strokeHalf = this.strokeWidth / 2 / renderContext.scale
        const strokeRect = canvasKit.LTRBRect(
            0 - w / 2 + strokeHalf,
            0 - h / 2 + strokeHalf,
            w / 2 - strokeHalf,
            h / 2 - strokeHalf,
        )

        // render fill
        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 255, 255, 1)
        paint.setColor(fillColor)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        renderContext.ctx.drawOval(rect, paint)

        // render stroke
        paint.setStrokeWidth(this.strokeWidth / renderContext.scale)
        const strokeColor = canvasKit.Color(170, 170, 170, 1)
        paint.setColor(strokeColor)
        paint.setStyle(canvasKit.PaintStyle.Stroke)
        renderContext.ctx.drawOval(strokeRect, paint)
    }

    private getCursor(): ResizeCursors {
        if (
            this.position === CornerPosition.TOP_LEFT ||
            this.position === CornerPosition.BOTTOM_RIGHT
        ) {
            return 'scale-resize-left'
        }
        return 'scale-resize-right'
    }

    onMouseEnter(): void {
        this.cursorService.setCursor(
            this.cursorToolName,
            this.getCursor(),
            CursorPriority.Hover,
        )
    }

    onMouseLeave(): void {
        this.cursorService.unsetCursor(this.cursorToolName)
    }

    onMouseDown(data: CanvasMouseEvent): void {
        this.initialBounds = {
            pointerX: data.pointer.x,
            pointerY: data.pointer.y,
            widgetX: this.shape.left,
            widgetY: this.shape.top,
            width: this.shape.width,
            height: this.shape.height,
            aspectRatio: this.shape.width / this.shape.height,
        }

        const editTable = new Map<Widget, EditingMethods[]>()
        editTable.set(this.shape, ['resize'])
        const { transactionId } = this.transactionHandler.begin('continuous', {
            editTable,
        })
        this.transactionId = transactionId
    }

    onMouseMove(data: CanvasMouseEvent): void {
        this.shape.width =
            this.initialBounds.width +
            data.pointer.x -
            this.initialBounds.pointerX
        this.shape.height =
            this.initialBounds.height +
            data.pointer.y -
            this.initialBounds.pointerY
        this.engine.canvas.requestRender()

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
                this.position === CornerPosition.TOP_RIGHT ||
                this.position === CornerPosition.BOTTOM_LEFT

            if (this._shiftDominantAxis === 'x') {
                const lockedY = deltaX / initial.aspectRatio
                deltaY = isDiagonalFlip ? -lockedY : lockedY
            } else {
                const lockedX = deltaY * initial.aspectRatio
                deltaX = isDiagonalFlip ? -lockedX : lockedX
            }
        }

        switch (this.position) {
            case CornerPosition.BOTTOM_RIGHT:
                this.shape.width = initial.width + deltaX
                this.shape.height = initial.height + deltaY
                break

            case CornerPosition.BOTTOM_LEFT: // Bottom-Left: Anchor is Top-Right
                this.shape.width = initial.width - deltaX
                this.shape.height = initial.height + deltaY
                this.shape.left = initial.widgetX + deltaX
                break

            case CornerPosition.TOP_RIGHT:
                this.shape.width = initial.width + deltaX
                this.shape.height = initial.height - deltaY
                this.shape.top = initial.widgetY + deltaY
                break

            case CornerPosition.TOP_LEFT: // Top-Left: Anchor is Bottom-Right
                this.shape.width = initial.width - deltaX
                this.shape.height = initial.height - deltaY
                this.shape.left = initial.widgetX + deltaX
                this.shape.top = initial.widgetY + deltaY
                break
        }

        if (this.transactionId) {
            this.transactionHandler.update(this.transactionId)
        }
        this.engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent): void {
        console.log('up')
        if (this.transactionId) {
            this.transactionHandler.commit(this.transactionId)
        }
    }

    updatePosition() {
        switch (this.position) {
            case CornerPosition.TOP_LEFT:
                this._x = this.shape.left
                this._y = this.shape.top
                break
            case CornerPosition.TOP_RIGHT:
                this._x = this.shape.right
                this._y = this.shape.top
                break
            case CornerPosition.BOTTOM_LEFT:
                this._x = this.shape.left
                this._y = this.shape.bottom
                break
            case CornerPosition.BOTTOM_RIGHT:
                this._x = this.shape.right
                this._y = this.shape.bottom
                break
        }
    }

    destroy() {
        this.shape.boundsChanged.remove(this.onShapeBoundsChanged, this)
    }
}
