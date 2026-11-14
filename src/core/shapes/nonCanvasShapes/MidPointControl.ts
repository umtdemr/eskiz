import { PointControl } from '@/core/shapes/nonCanvasShapes/PointControl'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas.ts'
import { CanvasMouseEvent } from '@/core/engine/Engine.ts'
import { BorderColor } from './Border'

const SIZE = 8
// shortest segment on screen that still has room for a mid point
const MIN_SEGMENT = 36

/**
 * Sits in the middle of a line segment, pointIndex is where the segment starts.
 * Does nothing until pressed, then it becomes a real point of the line.
 */
export class MidPointControl extends PointControl {
    private fits(scale: number) {
        const [a, b] = this.line.points.slice(this.pointIndex)
        if (!a || !b) return false

        return Math.hypot(b[0] - a[0], b[1] - a[1]) * scale >= MIN_SEGMENT
    }

    protected renderContent(renderContext: RenderContext) {
        if (this.paint?.isDeleted() || !this.fits(renderContext.scale)) {
            return
        }

        const r = SIZE / 2 / renderContext.scale

        this.paint.setStyle(canvasKit.PaintStyle.Fill)
        this.paint.setColor(
            canvasKit.Color(BorderColor.r, BorderColor.g, BorderColor.b, 1),
        )
        renderContext.ctx.drawCircle(0, 0, r, this.paint)

        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        this.paint.setStrokeWidth(1.5 / renderContext.scale)
        this.paint.setColor(canvasKit.Color(255, 255, 255, 1))
        renderContext.ctx.drawCircle(0, 0, r, this.paint)
    }

    updatePosition() {
        const points = this.line.absolutePoints
        const a = points[this.pointIndex]
        const b = points[this.pointIndex + 1]
        if (!a || !b) return

        this._x = (a[0] + b[0]) / 2
        this._y = (a[1] + b[1]) / 2
    }

    contains(pointX: number, pointY: number, scale: number): boolean {
        return this.fits(scale) && super.contains(pointX, pointY, scale)
    }

    onMouseDown(data: CanvasMouseEvent): void {
        // controls are rebuilt after this, this one only forwards the drag
        this.engine.reshapeHandler.start(data, this.line, this.pointIndex + 1, [
            this._x,
            this._y,
        ])
    }
}
