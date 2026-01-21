import { Widget, WidgetProps } from '../Widget'
import { RenderContext, canvasKit } from '@/core/canvas/Canvas'
import { WidgetType } from '@/core/constants'

export interface MagnetPointProps extends WidgetProps {
    isSnapped?: boolean
}

export class MagnetPoint extends Widget {
    private _isSnapped: boolean = false

    constructor(props: MagnetPointProps) {
        super(WidgetType.MAGNET_CIRCLE, props)
        this._isSnapped = props.isSnapped || false
        this._width = 10
        this._height = 10
        this._interactive = false
    }

    set isSnapped(val: boolean) {
        this._isSnapped = val
    }

    get isSnapped(): boolean {
        return this._isSnapped
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)

        const radius = 4 / renderContext.scale
        const centerX = this.width / 2
        const centerY = this.height / 2

        if (this._isSnapped) {
            // blue circle, white border
            paint.setStyle(canvasKit.PaintStyle.Fill)
            paint.setColor(canvasKit.Color(0, 0, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, paint)

            paint.setStyle(canvasKit.PaintStyle.Stroke)
            paint.setStrokeWidth(2 / renderContext.scale)
            paint.setColor(canvasKit.Color(255, 255, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, paint)
        } else {
            // white circle, blue border
            paint.setStyle(canvasKit.PaintStyle.Fill)
            paint.setColor(canvasKit.Color(255, 255, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, paint)

            paint.setStyle(canvasKit.PaintStyle.Stroke)
            paint.setStrokeWidth(1.5 / renderContext.scale)
            paint.setColor(canvasKit.Color(0, 0, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, paint)
        }
    }
}
