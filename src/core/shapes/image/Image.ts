import { WidgetType } from '@/core/constants'
import { Widget, WidgetProps } from '../Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Image as SkiaImage } from 'canvaskit-wasm'
import { ImageLoadingService } from '@/core/services/ImageLoadingService'
import { Engine } from '@/core/engine/Engine'

export interface ImageProps extends WidgetProps {
    properties: ImageProperties
}

export interface ImageProperties {}

export class Image extends Widget {
    private skImage: SkiaImage | null = null
    private imageLoadingService: ImageLoadingService
    constructor(props: ImageProps, engine: Engine) {
        super(WidgetType.IMAGE, props, engine)
        this._interactive = true
        this.imageLoadingService = engine.getService<ImageLoadingService>(
            'imageLoadingService',
        )
        this.loadImage()
    }

    private async loadImage() {
        const img = await this.imageLoadingService.loadImage(
            'https://placehold.co/400x400/png',
        )

        if (this.skImage) {
            this.skImage.delete()
        }

        this.skImage = img
        this.engine.canvas.requestRender()
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (!this.skImage || this.skImage.isDeleted()) {
            const paint = new canvasKit.Paint()
            paint.setAntiAlias(true)
            paint.setStyle(canvasKit.PaintStyle.Fill)
            const r = canvasKit.XYWHRect(0, 0, this._width, this.height)
            ctx.drawRect(r, paint)
        } else {
            const srcRect = canvasKit.XYWHRect(
                0,
                0,
                this.skImage.width(),
                this.skImage.height(),
            )
            const dstRect = canvasKit.XYWHRect(0, 0, this._width, this.height)
            ctx.drawImageRectOptions(
                this.skImage,
                srcRect,
                dstRect,
                canvasKit.FilterMode.Linear,
                canvasKit.MipmapMode.None,
            )
        }
    }

    destroy() {
        if (this.skImage) {
            this.skImage.delete()
        }
        super.destroy()
    }
}
