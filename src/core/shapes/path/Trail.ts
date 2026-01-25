import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Engine } from '@/core/engine/Engine'
import { Path, PathProps } from '@/core/shapes/path/Path'
import { ERASER_TRAIL } from '@/helpers/Constant'

export class Trail extends Path {
    constructor(props: PathProps, engine: Engine) {
        super('trail', props, engine)
    }

    protected renderContent(renderContext: RenderContext): void {
        const paint = new canvasKit.Paint()

        const strokeWidth =
            this._properties.strokeWidth || ERASER_TRAIL.DEFAULT_SIZE

        paint.setAntiAlias(true)
        paint.setStyle(canvasKit.PaintStyle.Stroke)
        paint.setStrokeWidth((strokeWidth as number) / renderContext.scale)
        paint.setStrokeCap(canvasKit.StrokeCap.Round)
        paint.setStrokeJoin(canvasKit.StrokeJoin.Round)

        const color = canvasKit.Color(180, 180, 180, 0.7)
        paint.setColor(color)

        renderContext.ctx.drawPath(this._path, paint)

        paint.delete()
    }
}
