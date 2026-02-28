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
import { ResizeHandler, ResizePosition } from '@/core/controls/ResizeHandler'
import { Paint } from 'canvaskit-wasm'

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
    private strokeWidth = 1.5
    private cursorToolName = CURSOR_OWNERS.CORNER_CONTROL
    private cursorService: CursorService
    private resizeHandler: ResizeHandler
    private paint: Paint

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

        this.resizeHandler = engine.resizeHandler

        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
    }

    private onShapeBoundsChanged() {
        this.updatePosition()
    }

    protected renderContent(renderContext: RenderContext) {
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
        this.paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 255, 255, 1)
        this.paint.setColor(fillColor)
        this.paint.setStyle(canvasKit.PaintStyle.Fill)
        renderContext.ctx.drawOval(rect, this.paint)

        // render stroke
        this.paint.setStrokeWidth(this.strokeWidth / renderContext.scale)
        const strokeColor = canvasKit.Color(170, 170, 170, 1)
        this.paint.setColor(strokeColor)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        renderContext.ctx.drawOval(strokeRect, this.paint)
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
        let resizePosition = ResizePosition.CORNER_TOP_LEFT
        switch (this.position) {
            case CornerPosition.TOP_RIGHT:
                resizePosition = ResizePosition.CORNER_TOP_RIGHT
                break
            case CornerPosition.BOTTOM_LEFT:
                resizePosition = ResizePosition.CORNER_BOTTOM_LEFT
                break
            case CornerPosition.BOTTOM_RIGHT:
                resizePosition = ResizePosition.CORNER_BOTTOM_RIGHT
                break
        }

        this.resizeHandler.start(data, this.shape, resizePosition)
    }

    onMouseMove(data: CanvasMouseEvent): void {
        if (this.resizeHandler.handle(data)) {
            this.engine.canvas.requestRender()
        }
    }

    onMouseUp(data: CanvasMouseEvent): void {
        this.resizeHandler.end(data)
    }

    updatePosition() {
        let point: { x: number; y: number }
        switch (this.position) {
            case CornerPosition.TOP_LEFT:
                point = this.shape.getPointFromRelative(-1, -1)
                break
            case CornerPosition.TOP_RIGHT:
                point = this.shape.getPointFromRelative(1, -1)
                break
            case CornerPosition.BOTTOM_LEFT:
                point = this.shape.getPointFromRelative(-1, 1)
                break
            case CornerPosition.BOTTOM_RIGHT:
                point = this.shape.getPointFromRelative(1, 1)
                break
        }

        this._x = point.x
        this._y = point.y
    }

    destroy() {
        this.shape.boundsChanged.remove(this.onShapeBoundsChanged, this)
        this.paint.delete()
        super.destroy()
    }
}
