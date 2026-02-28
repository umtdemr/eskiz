import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Engine } from '@/core/engine/Engine'
import { Path, PathProps } from '@/core/shapes/path/Path'
import { ERASER_TRAIL } from '@/helpers/Constant'
import { Paint as CkPaint } from 'canvaskit-wasm'

export class Trail extends Path {
    private _paint: CkPaint
    constructor(props: PathProps, engine: Engine) {
        super('trail', props, engine)
        this._paint = new canvasKit.Paint()
        this._paint.setAntiAlias(true)
        this._paint.setStyle(canvasKit.PaintStyle.Stroke)
        this._paint.setStrokeCap(canvasKit.StrokeCap.Round)
        this._paint.setStrokeJoin(canvasKit.StrokeJoin.Round)
        const color = canvasKit.Color(180, 180, 180, 0.7)
        this._paint.setColor(color)
    }

    protected renderContent(renderContext: RenderContext): void {
        if (!this._path || this._path.isDeleted()) return

        const strokeWidth =
            this._properties.strokeWidth || ERASER_TRAIL.DEFAULT_SIZE

        this._paint.setStrokeWidth(
            (strokeWidth as number) / renderContext.scale,
        )

        renderContext.ctx.drawPath(this._path, this._paint)
    }

    destroy() {
        this._paint.delete()
        super.destroy()
    }
}
