import { Widget, WidgetProps } from '../Widget'
import { RenderContext, canvasKit } from '@/core/canvas/Canvas'
import { WidgetType } from '@/core/constants'
import { Paint } from 'canvaskit-wasm'
import { Engine } from '@/core/engine/Engine'

export interface MagnetPointProps extends WidgetProps {
    isSnapped?: boolean
}

export class MagnetPoint extends Widget {
    private _isSnapped: boolean = false
    private paint: Paint

    constructor(props: MagnetPointProps, engine: Engine) {
        super(WidgetType.MAGNET_CIRCLE, props, engine)
        this._isSnapped = props.isSnapped || false
        this._width = 10
        this._height = 10
        this._interactive = false

        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
    }

    set isSnapped(val: boolean) {
        this._isSnapped = val
    }

    get isSnapped(): boolean {
        return this._isSnapped
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        const radius = 4 / renderContext.scale
        const centerX = this.width / 2
        const centerY = this.height / 2

        if (this._isSnapped) {
            // blue circle, white border
            this.paint.setStyle(canvasKit.PaintStyle.Fill)
            this.paint.setColor(canvasKit.Color(0, 0, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, this.paint)

            this.paint.setStyle(canvasKit.PaintStyle.Stroke)
            this.paint.setStrokeWidth(2 / renderContext.scale)
            this.paint.setColor(canvasKit.Color(255, 255, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, this.paint)
        } else {
            // white circle, blue border
            this.paint.setStyle(canvasKit.PaintStyle.Fill)
            this.paint.setColor(canvasKit.Color(255, 255, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, this.paint)

            this.paint.setStyle(canvasKit.PaintStyle.Stroke)
            this.paint.setStrokeWidth(1.5 / renderContext.scale)
            this.paint.setColor(canvasKit.Color(0, 0, 255, 1.0))
            ctx.drawCircle(centerX, centerY, radius, this.paint)
        }
    }

    destroy() {
        this.paint.delete()
        super.destroy()
    }
}
