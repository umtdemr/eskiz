import { ControlProps, Control } from '@/core/shapes/nonCanvasShapes/Control'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas.ts'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine.ts'
import { SelectionService } from '@/core/services/SelectionService.ts'
import { Line } from '@/core/shapes/line/Line.ts'
import { Paint } from 'canvaskit-wasm'

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
    private needsUpdate = false
    private paint: Paint

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
        this.engine.canvas.tick.add(this.onTick, this)
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
    }

    private onTick() {
        if (this.needsUpdate) {
            this.updatePosition()
            this.needsUpdate = false
        }
    }

    private onLineBoundsChanged() {
        this.needsUpdate = true
    }

    protected renderContent(renderContext: RenderContext) {
        if (this.paint?.isDeleted()) {
            return
        }

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
        this.engine.canvas.tick.remove(this.onTick, this)
        this.paint?.delete()
        super.destroy()
    }
}
