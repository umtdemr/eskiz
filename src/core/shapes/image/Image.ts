import { WidgetType, ImageType } from '@/core/constants'
import { Widget, WidgetProps, WidgetJson } from '@/core/shapes/Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Image as SkiaImage } from 'canvaskit-wasm'
import { TextureManager, TextureOptions } from '@/core/services/TextureManager'
import { Engine } from '@/core/engine/Engine'
import { WsWidget } from '@/types/Websocket'

const SVG_SCALE_TIERS = [1, 2, 3, 4] as const

export function getSvgScaleTier(scale: number): number {
    const dpr = window.devicePixelRatio || 1
    const effectiveScale = scale * dpr

    for (const tier of SVG_SCALE_TIERS) {
        if (effectiveScale <= tier) {
            return tier
        }
    }
    return SVG_SCALE_TIERS[SVG_SCALE_TIERS.length - 1]
}

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
    private textureManager: TextureManager

    private _localUrl: string | undefined
    private _imageData: ImageResponse | undefined
    private _state: ImageState = 'loadingRemote'

    private _currentVariationType: ImageVariationType | undefined
    private _loadingVariationType: ImageVariationType | undefined
    private _currentSvgScaleTier: number = 1
    private _loadingSvgScaleTier: number | undefined
    private _mimeType: string | undefined

    constructor(props: ImageProps, engine: Engine) {
        super(WidgetType.IMAGE, props, engine)
        this._interactive = true
        this._state = props.properties.localUrl ? 'local' : 'loadingRemote'
        this.textureManager =
            engine.getService<TextureManager>('textureManager')

        this._localUrl = props.properties.localUrl
        this._imageData = props.properties.imageData

        // determine mime type from image data if available
        if (this._imageData?.variations) {
            const original = this._imageData.variations.find(
                (v) => v.variation_type === 'original',
            )
            this._mimeType = original?.mime_type
        }

        if (this._localUrl) {
            this.loadImageForLocal()
        } else {
            this.loadImage('preview')
        }
    }

    private setState(state: ImageState) {
        this._state = state
    }

    private async loadImageForLocal(): Promise<void> {
        if (!this._localUrl) return

        try {
            const options: TextureOptions = {
                url: this._localUrl,
                isLocal: true,
            }
            const img = await this.textureManager.getTexture(options)
            if (img) {
                this.skImage = img
                this.engine.canvas.requestRender()
            }
        } catch (error) {
            console.error('Failed to load local image:', error)
        }
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

    private isSvg(): boolean {
        return this._mimeType?.includes('svg') ?? false
    }

    /**
     * Check if raster image needs update (variation change only).
     */
    private checkRasterNeedsUpdate(
        targetVariation: ImageVariationType | undefined,
    ): boolean {
        return (
            !!targetVariation &&
            targetVariation !== this._currentVariationType &&
            targetVariation !== this._loadingVariationType
        )
    }

    /**
     * Check if SVG needs update (variation change OR scale tier change).
     */
    private checkSvgNeedsUpdate(
        targetVariation: ImageVariationType | undefined,
        scale: number,
    ): boolean {
        const variationChanged =
            !!targetVariation &&
            targetVariation !== this._currentVariationType &&
            targetVariation !== this._loadingVariationType

        if (variationChanged) return true

        const currentScaleTier = getSvgScaleTier(scale)
        const scaleChanged =
            currentScaleTier !== this._currentSvgScaleTier &&
            currentScaleTier !== this._loadingSvgScaleTier

        return scaleChanged
    }

    private async loadImage(
        variationType?: ImageVariationType,
        scale: number = 1,
    ) {
        let url = ''
        let targetVariationType = variationType
        let variationWidth: number | undefined
        let variationHeight: number | undefined
        let targetIsSvg = false

        if (!this._imageData) {
            // todo: show placeholder
            this.setState('error')
            return
        }

        if (!targetVariationType) {
            const best = this.getBestVariation(1)
            if (best) {
                targetVariationType = best.variation_type as ImageVariationType
            }
        }

        // find path and variation dimensions first to determine if it's SVG
        const variations = this._imageData.variations || []

        const target = variations.find(
            (v) => v.variation_type === targetVariationType,
        )

        if (target && target.file_path) {
            url = `${import.meta.env.VITE_BACKEND_URL}v1/images/${target.file_path}`
            variationWidth = target.width
            variationHeight = target.height
            targetIsSvg = target.mime_type?.includes('svg') ?? false
        } else {
            // fallback to original
            const original = variations.find(
                (v) => v.variation_type === 'original',
            )
            if (original && original.file_path) {
                url = `${import.meta.env.VITE_BACKEND_URL}v1/images/${original.file_path}`
                variationWidth = original.width
                variationHeight = original.height
                targetIsSvg = original.mime_type?.includes('svg') ?? false
                targetVariationType = 'original'
            }
        }

        const svgScaleTier =
            targetIsSvg && targetVariationType === 'original'
                ? getSvgScaleTier(scale)
                : undefined

        // If we are already loading this exact variation (and scale for SVG), skip
        if (
            targetVariationType &&
            this._loadingVariationType === targetVariationType
        ) {
            if (targetIsSvg && targetVariationType === 'original') {
                if (this._loadingSvgScaleTier === svgScaleTier) {
                    return
                }
            } else {
                return
            }
        }

        // If we already have this variation (and scale for SVG) loaded as current, skip
        if (
            targetVariationType &&
            this._currentVariationType === targetVariationType
        ) {
            if (targetIsSvg && targetVariationType === 'original') {
                if (this._currentSvgScaleTier === svgScaleTier) {
                    return
                }
            } else {
                return
            }
        }

        // set loading state after deduplication checks
        this._loadingVariationType = targetVariationType
        if (targetIsSvg && targetVariationType === 'original') {
            this._loadingSvgScaleTier = svgScaleTier
        }

        if (!this.skImage) {
            this.setState('loadingRemote')
        }

        if (!url) {
            // todo: show placeholder
            this.setState('error')
            return
        }

        try {
            // build texture options - only include scale for SVG originals
            const options: TextureOptions = {
                url,
                isLocal: !!this._localUrl,
                isSvg: targetIsSvg,
                width: variationWidth,
                height: variationHeight,
                scale: this._loadingSvgScaleTier,
            }

            const img = await this.textureManager.getTexture(options)

            this.setState(this._localUrl ? 'local' : 'loadedRemote')

            if (img) {
                this.skImage = img
                if (targetVariationType) {
                    this._currentVariationType = targetVariationType
                }
                // Only update current SVG scale tier for SVG originals
                if (targetIsSvg && targetVariationType === 'original') {
                    this._currentSvgScaleTier = this._loadingSvgScaleTier ?? 1
                }
                this.engine.canvas.requestRender()
            }
        } catch {
            this.setState('error')
        } finally {
            if (this._loadingVariationType === targetVariationType) {
                this._loadingVariationType = undefined
                this._loadingSvgScaleTier = undefined
            }
        }
    }

    /**
     * Set the mime type for local uploads.
     */
    setMimeType(mimeType: string): void {
        this._mimeType = mimeType
    }

    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx
        const currentScale = renderContext.scale

        // LOD Check for remote images only (local images are loaded once)
        if (this._imageData && !this._localUrl) {
            const best = this.getBestVariation(currentScale)
            const targetVariation = best?.variation_type as
                | ImageVariationType
                | undefined

            // For SVGs (original): check both variation change AND scale tier change
            // For PNGs (preview/md): only check variation change
            const needsUpdate =
                this.isSvg() && targetVariation === 'original'
                    ? this.checkSvgNeedsUpdate(targetVariation, currentScale)
                    : this.checkRasterNeedsUpdate(targetVariation)

            if (needsUpdate) {
                this.loadImage(targetVariation, currentScale)
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
            const paint = new canvasKit.Paint()
            paint.setColor(canvasKit.BLACK)
            paint.setAlphaf(0.5)
            const r = canvasKit.XYWHRect(0, 0, this._width, this.height)
            ctx.drawRect(r, paint)
            paint.delete()

            const loadingPaint = new canvasKit.Paint()
            loadingPaint.setColor(canvasKit.WHITE)
            loadingPaint.setStyle(canvasKit.PaintStyle.Fill)
            loadingPaint.setAntiAlias(true)

            const cx = this._width / 2
            const cy = this.height / 2
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
        this._currentVariationType = undefined
        this._loadingVariationType = undefined
        this._currentSvgScaleTier = 1

        if (this._localUrl) {
            URL.revokeObjectURL(this._localUrl)
            this._localUrl = undefined
        }

        // update mime type from server response
        if (data.variations) {
            const original = data.variations.find(
                (v) => v.variation_type === 'original',
            )
            this._mimeType = original?.mime_type
        }

        // reload remote image
        this.loadImage('preview')
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
            angle: this._angle,
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
                angle: json.angle,
            },
            engine,
        )
    }

    destroy() {
        this.skImage = null
        super.destroy()
    }

    canSnap(): boolean {
        return true
    }

    canRotate(): boolean {
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
