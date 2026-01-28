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

export type ImageState = 'local' | 'loadingRemote' | 'loadedRemote' | 'error'
export type ImageVariationType = 'preview' | 'md' | 'original'

export class Image extends Widget {
    private skImage: SkiaImage | null = null
    private imageLoadingService: ImageLoadingService

    private _localUrl: string | undefined
    private _imageData: ImageResponse | undefined
    private _state: ImageState = 'loadingRemote'

    private _currentVariationType: ImageVariationType | undefined
    private _loadingVariationType: ImageVariationType | undefined
    private _loadedVariations: Map<ImageVariationType, SkiaImage> = new Map()

    constructor(props: ImageProps, engine: Engine) {
        super(WidgetType.IMAGE, props, engine)
        this._interactive = true
        this._state = props.properties.localUrl ? 'local' : 'loadingRemote'
        this.imageLoadingService = engine.getService<ImageLoadingService>(
            'imageLoadingService',
        )

        this._localUrl = props.properties.localUrl
        this._imageData = props.properties.imageData

        this.loadImage('preview')
    }

    private setState(state: ImageState) {
        this._state = state
    }

    private getBestVariation(scale: number): ImageVariation | undefined {
        if (!this._imageData || !this._imageData.variations) return undefined

        const renderedWidth = this._width * scale
        let preferredType = 'original'

        if (renderedWidth <= 120) {
            preferredType = 'preview'
        } else if (renderedWidth <= 1000) {
            preferredType = 'md'
        }

        const variations = this._imageData.variations
        let best = variations.find((v) => v.variation_type === preferredType)

        if (!best) {
            // fallback chain: preview -> md -> original
            if (preferredType === 'preview') {
                best = variations.find((v) => v.variation_type === 'md')
            }
            if (!best) {
                best = variations.find((v) => v.variation_type === 'original')
            }
        }

        return best
    }

    private async loadImage(variationType?: ImageVariationType) {
        let url = ''

        let targetVariationType = variationType

        if (this._localUrl) {
            url = this._localUrl
        } else if (this._imageData) {
            if (!targetVariationType) {
                // If no type requested, guess based on current scale
                const best = this.getBestVariation(1)
                if (best) {
                    targetVariationType =
                        best.variation_type as ImageVariationType
                }
            }

            // If we are already loading this exact variation, skip
            if (
                targetVariationType &&
                this._loadingVariationType === targetVariationType
            ) {
                return
            }

            // If we already have this variation loaded as current, skip
            if (
                targetVariationType &&
                this._currentVariationType === targetVariationType
            ) {
                return
            }

            // cache check
            if (
                targetVariationType &&
                this._loadedVariations.has(targetVariationType)
            ) {
                this.skImage = this._loadedVariations.get(targetVariationType)!
                this._currentVariationType = targetVariationType
                this.engine.canvas.requestRender()
                return
            }

            // find path
            const variations = this._imageData.variations || []
            const target = variations.find(
                (v) => v.variation_type === targetVariationType,
            )

            if (target && target.file_path) {
                url = `${import.meta.env.VITE_BACKEND_URL}v1/images/${target.file_path}`
                this._loadingVariationType = targetVariationType
            } else {
                // fallback to original if specific not found
                const original = variations.find(
                    (v) => v.variation_type === 'original',
                )
                if (original && original.file_path) {
                    url = `${import.meta.env.VITE_BACKEND_URL}v1/images/${original.file_path}`
                    // Treat fallback as original for caching purposes if it is indeed original
                    this._loadingVariationType = 'original'
                    targetVariationType = 'original'
                }
            }

            if (!this.skImage) {
                this.setState('loadingRemote')
            }
        }

        try {
            const img = await this.imageLoadingService.loadImage(url)

            this.setState(this._localUrl ? 'local' : 'loadedRemote')

            if (img) {
                this.skImage = img
                if (targetVariationType) {
                    this._loadedVariations.set(targetVariationType, img)
                    this._currentVariationType = targetVariationType
                }
                this.engine.canvas.requestRender()
            }
        } catch (error) {
            this.setState('error')
        } finally {
            if (this._loadingVariationType === targetVariationType) {
                this._loadingVariationType = undefined
            }
        }
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        // LOD Check
        if (this._imageData && !this._localUrl) {
            const best = this.getBestVariation(renderContext.scale)
            if (
                best &&
                best.variation_type !== this._currentVariationType &&
                best.variation_type !== this._loadingVariationType
            ) {
                this.loadImage(best.variation_type as ImageVariationType)
            }
        }

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

        // draw loading overlay only if we have NO image to show
        if (
            (this._state === 'local' || this._state === 'loadingRemote') &&
            !this.skImage
        ) {
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
        this._currentVariationType = undefined
        this._loadingVariationType = undefined

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
        this._loadedVariations.forEach((img) => img.delete())
        this._loadedVariations.clear()

        // if we have a skImage that is not in the map, delete it
        if (this.skImage && !this.skImage.isDeleted()) {
            this.skImage.delete()
        }

        super.destroy()
    }

    canSnap(): boolean {
        return true
    }

    getSnapPoints(): { x: number; y: number }[] {
        const bounds = this.bounds
        return [
            { x: bounds.x + bounds.width / 2, y: bounds.y }, // top center
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // bottom center
            { x: bounds.x, y: bounds.y + bounds.height / 2 }, // left center
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // right center
        ]
    }
}
