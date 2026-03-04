import { Widget } from '../Widget'
import { Control, ControlProps } from './Control'
import { Paint } from 'canvaskit-wasm'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { RotateHandler } from '@/core/controls/RotateHandler'
import { reverseRotatePoint } from '@/core/geometry/math'

const ROTATE_CONTROL_OFFSET = 23

const recorder = new canvasKit.PictureRecorder()
const recordingCanvas = recorder.beginRecording(
    canvasKit.LTRBRect(0, 0, 24, 24),
)

const paint = new canvasKit.Paint()
paint.setStyle(canvasKit.PaintStyle.Stroke)
paint.setAntiAlias(true)
paint.setStrokeWidth(1)
paint.setColor(canvasKit.BLACK)
paint.setStrokeCap(canvasKit.StrokeCap.Round)
paint.setStrokeJoin(canvasKit.StrokeJoin.Round)

const path1 = canvasKit.Path.MakeFromSVGString(
    'M21 12C21 10.22 20.4722 8.47991 19.4832 6.99987C18.4943 5.51983 17.0887 4.36627 15.4442 3.68508C13.7996 3.00389 11.99 2.82566 10.2442 3.17293C8.49836 3.5202 6.89472 4.37737 5.63604 5.63604C4.37737 6.89471 3.5202 8.49836 3.17294 10.2442C2.82567 11.99 3.0039 13.7996 3.68509 15.4442C4.36628 17.0887 5.51983 18.4943 6.99987 19.4832C8.47991 20.4722 10.22 21 12 21C14.52 21 16.93 20 18.74 18.26L21 16',
)
const path2 = canvasKit.Path.MakeFromSVGString('M21 21V16H16')

const scale = 20 / 24
const matrix = canvasKit.Matrix.scaled(scale, scale)
path1!.transform(matrix)
path2!.transform(matrix)

recordingCanvas.drawPath(path1!, paint)
recordingCanvas.drawPath(path2!, paint)

const rotateIconPicture = recorder.finishRecordingAsPicture()

paint.delete()
path1?.delete()
path2?.delete()
recorder.delete()

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
        this.width = 20
        this.height = 20
    }

    private onShapeBoundsChanged() {
        this.updatePosition()
    }

    private onZoomChanged() {
        this.updatePosition()
    }

    protected renderContent(renderContext: RenderContext) {
        // render rotate icon
        renderContext.ctx.save()
        const iconScale = 1 / renderContext.scale
        renderContext.ctx.scale(iconScale, iconScale)
        renderContext.ctx.translate(-this.width / 2, -this.height / 2)
        renderContext.ctx.drawPicture(rotateIconPicture)
        renderContext.ctx.restore()
    }

    updatePosition() {
        const point = this.shape.getPointFromRelative(-1, 1)
        const offset = ROTATE_CONTROL_OFFSET / this.engine.canvas.zoom
        const rotatedOffset = reverseRotatePoint(
            offset,
            offset,
            0,
            0,
            this.shape.angle,
        )
        this._x = point.x - rotatedOffset.x
        this._y = point.y + rotatedOffset.y
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
