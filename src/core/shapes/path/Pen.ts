import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Path, PathProps } from '@/core/shapes/path/Path'
import { RGBA } from '@/core/shapes/Color'

export class Pen extends Path {
    constructor(props: PathProps) {
        super('pen', props)
        this._interactive = true
    }

    protected renderContent(renderContext: RenderContext): void {
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        const color = canvasKit.Color(
            (this._properties.color as RGBA).r,
            (this._properties.color as RGBA).g,
            (this._properties.color as RGBA).b,
            (this._properties.color as RGBA).a,
        )
        paint.setColor(color)

        renderContext.ctx.drawPath(this._path, paint)
        paint.delete()
    }
}
