import { Widget } from '../Widget'
import { Control, ControlProps } from './Control'
import { Paint } from 'canvaskit-wasm'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { RotateHandler } from '@/core/controls/RotateHandler'

export interface RotateControlProps extends ControlProps {}

export class RotateControl extends Control {
    private shape: Widget
    private paint: Paint
    private rotateHandler: RotateHandler

    constructor(
        props: RotateControlProps,
        engine: Engine,
        selectionService: SelectionService,
    ) {
        super(props, 'corner', engine, selectionService)
        this.shape = this.selectionService.selected[0]

        this.shape.boundsChanged.add(this.onShapeBoundsChanged, this)

        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.rotateHandler = engine.rotateHandler

        this.engine.zoomChanged.add(this.onZoomChanged, this)
        this.updatePosition()
    }

    private onShapeBoundsChanged() {
        this.updatePosition()
    }

    private onZoomChanged() {
        this.updatePosition()
    }

    protected renderContent(renderContext: RenderContext) {
        // dummy as of now
        const stroke = 2
        const w = this.width / renderContext.scale
        const h = this.height / renderContext.scale

        const rect = canvasKit.LTRBRect(0 - w / 2, 0 - h / 2, w / 2, h / 2)

        const strokeHalf = stroke / 2 / renderContext.scale
        const strokeRect = canvasKit.LTRBRect(
            0 - w / 2 + strokeHalf,
            0 - h / 2 + strokeHalf,
            w / 2 - strokeHalf,
            h / 2 - strokeHalf,
        )

        // render fill
        this.paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(0, 255, 255, 1)
        this.paint.setColor(fillColor)
        this.paint.setStyle(canvasKit.PaintStyle.Fill)
        renderContext.ctx.drawOval(rect, this.paint)

        // render stroke
        this.paint.setStrokeWidth(stroke / renderContext.scale)
        const strokeColor = canvasKit.Color(170, 170, 170, 1)
        this.paint.setColor(strokeColor)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        renderContext.ctx.drawOval(strokeRect, this.paint)
    }

    updatePosition() {
        const offset = 23 / this.engine.canvas.zoom
        const point = this.shape.getPointFromRelative(-1, 1)
        this._x = point.x - offset
        this._y = point.y + offset
    }

    onMouseDown(data: CanvasMouseEvent): void {
        this.rotateHandler.start(data, this.shape)
    }

    onMouseMove(data: CanvasMouseEvent): void {
        this.rotateHandler.handle(data)
    }

    onMouseUp(data: CanvasMouseEvent): void {
        this.rotateHandler.end(data)
    }

    destroy() {
        this.engine.zoomChanged.remove(this.onZoomChanged, this)
        this.shape.boundsChanged.remove(this.onShapeBoundsChanged, this)
        this.paint.delete()
        super.destroy()
    }
}
