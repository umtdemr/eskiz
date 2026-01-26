import { WidgetType, ImageType } from '@/core/constants'
import { Widget, WidgetProps, WidgetJson } from '@/core/shapes/Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Image as SkiaImage } from 'canvaskit-wasm'
import { ImageLoadingService } from '@/core/services/ImageLoadingService'
import { Engine } from '@/core/engine/Engine'
import { WsWidget } from '@/types/Websocket'

export interface ImageProps extends WidgetProps {
    properties: ImageProperties
}

export interface ImageVariation {
    id: number
    image_id: number
    variation_type: string
    file_path: string
    mime_type: string
    size_bytes: number
    width: number
    height: number
    created_at: string
}

export interface ImageDetail {
    id: number
    user_id: number
    board_id: number
    uuid: string
    original_name: string
    created_at: string
}

export interface ImageResponse {
    image: ImageDetail
    variations: ImageVariation[]
}

export interface ImageProperties {
    localUrl?: string
    imageData?: ImageResponse
}

export class Image extends Widget {
    private skImage: SkiaImage | null = null
    private imageLoadingService: ImageLoadingService

    private _localUrl: string | undefined
    private _imageData: ImageResponse | undefined

    constructor(props: ImageProps, engine: Engine) {
        super(WidgetType.IMAGE, props, engine)
        this._interactive = true
        this.imageLoadingService = engine.getService<ImageLoadingService>(
            'imageLoadingService',
        )

        this._localUrl = props.properties.localUrl
        this._imageData = props.properties.imageData

        this.loadImage()
    }

    private async loadImage() {
        let url = 'https://placehold.co/400x400/png' // fallback

        if (this._localUrl) {
            url = this._localUrl
        } else if (this._imageData) {
            // find path
            const variations = this._imageData.variations || []
            const original = variations.find(
                (v) => v.variation_type === 'original',
            )

            if (original && original.file_path) {
                url = `${import.meta.env.VITE_BACKEND_URL}/v1/images/${original.file_path}`
            }
        }

        const img = await this.imageLoadingService.loadImage(url)

        if (this.skImage) {
            this.skImage.delete()
        }

        if (img) {
            this.skImage = img
            this.engine.canvas.requestRender()
        }
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (this.skImage && !this.skImage.isDeleted()) {
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

        // draw loading overlay if local
        if (this._localUrl) {
            // transparent black rect
            const paint = new canvasKit.Paint()
            paint.setColor(canvasKit.BLACK)
            paint.setAlphaf(0.5)
            const r = canvasKit.XYWHRect(0, 0, this._width, this.height)
            ctx.drawRect(r, paint)

            paint.delete()

            // draw three loading circles
            const loadingPaint = new canvasKit.Paint()
            loadingPaint.setColor(canvasKit.WHITE)
            loadingPaint.setStyle(canvasKit.PaintStyle.Fill)
            loadingPaint.setAntiAlias(true)

            const cx = this._width / 2
            const cy = this.height / 2

            // dynamic scale: 2% of min dimension, clamped between 4 and 60
            const minDim = Math.min(this._width, this._height)
            const radius = Math.max(Math.min(minDim * 0.02, 60), 4)
            const spacing = radius * 3.5

            ctx.drawCircle(cx - spacing, cy, radius, loadingPaint)
            ctx.drawCircle(cx, cy, radius, loadingPaint)
            ctx.drawCircle(cx + spacing, cy, radius, loadingPaint)

            loadingPaint.delete()
        }
    }

    onUploadSuccess(data: ImageResponse) {
        this._imageData = data
        this._localUrl = undefined

        if (this._localUrl) {
            URL.revokeObjectURL(this._localUrl)
            this._localUrl = undefined
        }

        // reload remote image
        this.loadImage()
    }

    toJson(): WidgetJson {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex || '0',
            uuid: this._uuid || '',
            properties: {
                imageData: this._imageData,
            },
            widget_type: WidgetType.IMAGE,
            sub_type: ImageType.IMAGE,
            parent_widget_id: this._parent_widget_id,
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
        }
    }

    static loadFromJson(json: WsWidget, engine: Engine): Image {
        return new Image(
            {
                x: json.x,
                y: json.y,
                width: json.width,
                height: json.height,
                z_index: json.z_index,
                parentLayer: engine.stage.widgetsDefaultLayer,
                uuid: json.uuid,
                is_locked: json.is_locked,
                properties: {
                    imageData: json.properties.imageData as ImageResponse,
                },
            },
            engine,
        )
    }

    destroy() {
        if (this.skImage) {
            this.skImage.delete()
        }
        super.destroy()
    }
}
