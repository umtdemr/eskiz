import { Widget, WidgetProps } from '@/core/shapes/Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { RGBA } from '@/core/shapes/Color'
import { CANVAS_COLORS } from '@/helpers/Constant'
import { Path as CkPath } from 'canvaskit-wasm'

export interface PathProps extends WidgetProps {
    properties: PathProperties
}

export interface PathProperties {
    strokeColor?: RGBA
    strokeWidth?: number
}

export class Path extends Widget {
    path: CkPath

    constructor(props: PathProps) {
        super('path', props)
        this._properties = { ...props.properties }
        this._properties.strokeColor = this._properties?.strokeColor
            ? props.properties.strokeColor
            : CANVAS_COLORS.BLACK
        this._properties.strokeWidth = this._properties?.strokeWidth
            ? props.properties.strokeWidth
            : 2
        this.path = new canvasKit.Path()
        this._interactive = true
    }

    renderContent(renderContext: RenderContext): void {
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        const color = canvasKit.Color(
            (this._properties.strokeColor as RGBA).r,
            (this._properties.strokeColor as RGBA).g,
            (this._properties.strokeColor as RGBA).b,
            (this._properties.strokeColor as RGBA).a,
        )
        paint.setColor(color)

        renderContext.ctx.drawPath(this.path, paint)
        paint.delete()
    }
}
