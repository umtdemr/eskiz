import { ControlProps, Control } from '@/core/shapes/nonCanvasShapes/Control'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas.ts'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine.ts'
import { SelectionService } from '@/core/services/SelectionService.ts'
import { Line } from '@/core/shapes/line/Line.ts'

export interface PointControlProps extends ControlProps {
    pointIndex: number
}

/**
 * PointControl is a controller for editing specific points of a Line.
 */
export class PointControl extends Control {
    pointIndex: number
    private line: Line
    private strokeWidth = 1.5

    constructor(
        props: PointControlProps,
        engine: Engine,
        selectionService: SelectionService,
    ) {
        super(props, 'corner', engine, selectionService)
        this.pointIndex = props.pointIndex
        this.line = this.selectionService.selected[0] as Line

        this.line.boundsChanged.add(this.onLineBoundsChanged, this)
        this.updatePosition()
    }

    private onLineBoundsChanged() {
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

        paint.delete()
    }

    updatePosition() {
        const absolutePoints = this.line.absolutePoints
        if (this.pointIndex >= 0 && this.pointIndex < absolutePoints.length) {
            const point = absolutePoints[this.pointIndex]
            this._x = point[0]
            this._y = point[1]
        }
    }

    onMouseDown(data: CanvasMouseEvent): void {
        this.engine.reshapeHandler.start(data, this.line, this.pointIndex)
    }

    onMouseMove(data: CanvasMouseEvent): void {
        this.engine.reshapeHandler.handle(data)
    }

    onMouseUp(data: CanvasMouseEvent): void {
        this.engine.reshapeHandler.end(data)
    }

    destroy() {
        this.line.boundsChanged.remove(this.onLineBoundsChanged, this)
        super.destroy()
    }
}
