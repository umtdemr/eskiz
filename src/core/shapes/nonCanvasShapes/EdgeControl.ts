import { Control, ControlProps } from '@/core/shapes/nonCanvasShapes/Control.ts'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine.ts'
import { SelectionService } from '@/core/services/SelectionService.ts'
import { Widget } from '@/core/shapes/Widget.ts'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas.ts'
import {
    ResizeCursors,
    getRotatedResizeCursor,
} from '@/core/services/CursorService.ts'
import { CURSOR_OWNERS } from '@/helpers/Constant.ts'
import { CursorService, CursorPriority } from '@/core/services/CursorService.ts'
import { ResizeHandler, ResizePosition } from '@/core/controls/ResizeHandler'
import { Paint } from 'canvaskit-wasm'
import { reverseRotatePoint } from '@/core/geometry/math'

export enum EdgePosition {
    LEFT,
    TOP,
    RIGHT,
    BOTTOM,
}

export interface EdgeControlProps extends ControlProps {
    position: EdgePosition
}

/**
 * EdgeControl is a control widget for resizing in one direction.
 */
export class EdgeControl extends Control {
    private position: EdgePosition
    private shape: Widget
    private direction: 'horizontal' | 'vertical'
    private _debug: boolean = false
    private _strokeThickness = 2
    private _hitTestThreshold = 5
    private _maxThreshold = 30
    private cursorToolName = CURSOR_OWNERS.EDGE_CONTROL
    private cursorService: CursorService
    private resizeHandler: ResizeHandler
    private paint: Paint

    constructor(
        props: EdgeControlProps,
        engine: Engine,
        selectionService: SelectionService,
    ) {
        super(props, 'corner', engine, selectionService)
        this.position = props.position
        if (
            this.position === EdgePosition.LEFT ||
            this.position === EdgePosition.RIGHT
        ) {
            this.direction = 'vertical'
        } else {
            this.direction = 'horizontal'
        }
        this.shape = this.selectionService.selected[0]
        this.shape.boundsChanged.add(this.onShapeBoundsChanged, this)
        this.updateTransform()

        this.cursorService = engine.getService<CursorService>('cursor')
        this.resizeHandler = engine.resizeHandler

        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
    }

    protected renderContent(renderContext: RenderContext) {
        if (!this._debug) {
            return
        }

        let w = this._width
        let h = this._height

        if (this.direction === 'vertical') {
            w /= renderContext.scale
        } else {
            h /= renderContext.scale
        }

        const rect = canvasKit.LTRBRect(0, 0, w, h)

        this.paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 0, 0, 1)
        this.paint.setColor(fillColor)
        this.paint.setStyle(canvasKit.PaintStyle.Fill)

        renderContext.ctx.drawRect(rect, this.paint)
    }

    private updateTransform() {
        this.angle = this.shape.angle

        let point: { x: number; y: number } = { x: 0, y: 0 }
        switch (this.position) {
            case EdgePosition.LEFT:
                point = this.shape.getPointFromRelative(-1, 0)
                this.height = this.shape.height
                this.width = this._strokeThickness
                break
            case EdgePosition.RIGHT:
                point = this.shape.getPointFromRelative(1, 0)
                this.height = this.shape.height
                this.width = this._strokeThickness
                break
            case EdgePosition.TOP:
                point = this.shape.getPointFromRelative(0, -1)
                this.height = this._strokeThickness
                this.width = this.shape.width
                break
            case EdgePosition.BOTTOM:
                point = this.shape.getPointFromRelative(0, 1)
                this.height = this._strokeThickness
                this.width = this.shape.width
                break
        }

        this._x = point.x - this.width / 2
        this._y = point.y - this.height / 2
    }

    private onShapeBoundsChanged() {
        this.updateTransform()
    }

    private getCursor(): ResizeCursors {
        let baseIndex: number
        switch (this.position) {
            case EdgePosition.TOP:
                baseIndex = 0
                break
            case EdgePosition.RIGHT:
                baseIndex = 2
                break
            case EdgePosition.BOTTOM:
                baseIndex = 4
                break
            case EdgePosition.LEFT:
                baseIndex = 6
                break
        }
        return getRotatedResizeCursor(baseIndex, this.shape.angle)
    }

    onMouseDown(data: CanvasMouseEvent): void {
        let position: ResizePosition = ResizePosition.EDGE_LEFT
        switch (this.position) {
            case EdgePosition.TOP:
                position = ResizePosition.EDGE_TOP
                break
            case EdgePosition.RIGHT:
                position = ResizePosition.EDGE_RIGHT
                break
            case EdgePosition.BOTTOM:
                position = ResizePosition.EDGE_BOTTOM
                break
        }
        this.resizeHandler.start(data, this.shape, position)
    }

    onMouseMove(data: CanvasMouseEvent): void {
        if (this.resizeHandler.handle(data)) {
            this.updateTransform()
            this.engine.canvas.requestRender()
        }
    }

    onMouseUp(data: CanvasMouseEvent): void {
        this.resizeHandler.end(data)
    }

    onMouseEnter() {
        this.cursorService.setCursor(
            this.cursorToolName,
            this.getCursor(),
            CursorPriority.Hover,
        )
    }
    onMouseLeave() {
        this.cursorService.unsetCursor(this.cursorToolName)
    }

    contains(pointX: number, pointY: number, scale: number): boolean {
        let localPointX = pointX
        let localPointY = pointY

        if (this.angle !== 0) {
            const rotatedPoint = reverseRotatePoint(
                pointX,
                pointY,
                this.centerX,
                this.centerY,
                this.angle,
            )

            localPointX = rotatedPoint.x
            localPointY = rotatedPoint.y
        }

        let w = this.width
        let h = this.height

        if (this.direction === 'vertical') {
            w /= scale
        } else {
            h /= scale
        }

        let left = this.left
        let right = this.left + w
        let top = this.top
        let bottom = this.top + h

        let threshold = this._hitTestThreshold / scale
        threshold = Math.min(threshold, this._maxThreshold)

        if (this.direction === 'vertical') {
            left -= threshold
            right += threshold
        } else {
            top -= threshold
            bottom += threshold
        }

        const isInside =
            localPointX >= left &&
            localPointX <= right &&
            localPointY >= top &&
            localPointY <= bottom

        return isInside
    }

    destroy() {
        this.shape.boundsChanged.remove(this.onShapeBoundsChanged, this)
        this.paint.delete()
        super.destroy()
    }

    set debug(bool: boolean) {
        this._debug = bool
    }
}
