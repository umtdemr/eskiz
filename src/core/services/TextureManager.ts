import { Service } from './Service'
import { canvasKit } from '@/core/canvas/Canvas'
import { Image as SkiaImage } from 'canvaskit-wasm'
import { ImageLoadingService } from './ImageLoadingService'
import { Engine } from '@/core/engine/Engine'

interface CacheEntry {
    image: SkiaImage
    size: number
    lastUsed: number
}

/**
 * Maximum SVG rasterization size to prevent memory issues.
 */
const MAX_SVG_RASTER_SIZE = 4096

export interface TextureOptions {
    url: string
    isLocal?: boolean
    isSvg?: boolean
    width?: number
    height?: number
    scale?: number
}

export class TextureManager extends Service {
    private cache: Map<string, CacheEntry> = new Map()
    private pendingRequests: Map<string, Promise<SkiaImage | null>> = new Map()
    private invalidatedKeys: Set<string> = new Set()
    private currentMemory: number = 0
    private maxMemory: number = 512 * 1024 * 1024 // 512MB

    private imageLoadingService: ImageLoadingService

    constructor(engine: Engine, imageLoadingService: ImageLoadingService) {
        super(engine)
        this.imageLoadingService = imageLoadingService
    }

    /**
     * Get a texture for a given URL.
     *
     * For local images: loaded once without scaling
     * For remote PNGs (preview/md): loaded directly
     * For remote SVGs (original): rasterized at scale tier based on zoom
     */
    async getTexture(options: TextureOptions): Promise<SkiaImage | null> {
        const { url, isLocal, isSvg, width, height, scale } = options

        // Build cache key
        let cacheKey: string
        if (isLocal) {
            cacheKey = url
        } else if (isSvg && width && height && scale) {
            // Remote SVGs: include scale tier (1-4) in cache key
            cacheKey = `${url}:${Math.ceil(width)}x${Math.ceil(height)}@${scale}x`
        } else {
            // remote raster
            cacheKey = url
        }

        // check in-memory cache first
        const cached = this.cache.get(cacheKey)
        if (cached && !cached.image.isDeleted()) {
            cached.lastUsed = Date.now()
            return cached.image
        }

        // check if there's already a pending request for this exact key
        const pending = this.pendingRequests.get(cacheKey)
        if (pending) {
            return pending
        }

        // create and store the pending request
        const request = this.fetchAndCreateTexture(options, cacheKey)
        this.pendingRequests.set(cacheKey, request)

        try {
            return await request
        } finally {
            this.pendingRequests.delete(cacheKey)
        }
    }

    private async fetchAndCreateTexture(
        options: TextureOptions,
        cacheKey: string,
    ): Promise<SkiaImage | null> {
        const { url, isLocal, isSvg, width, height, scale } = options

        // fetch from ImageLoadingService
        const result = await this.imageLoadingService.loadImage(url)

        if (this.invalidatedKeys.has(cacheKey)) {
            this.invalidatedKeys.delete(cacheKey)
            return null
        }

        if (!result) {
            return null
        }

        // If it's an SVG that needs scaling (remote original SVG)
        if (result.isSvg && isSvg && !isLocal && width && height && scale) {
            // scale is already the tier (1-4) passed from Image.ts
            return this.rasterizeSvg(
                result.data as string,
                cacheKey,
                width,
                height,
                scale,
            )
        }

        if (result.isSvg) {
            return this.rasterizeSvg(result.data as string, cacheKey)
        } else {
            return this.createTextureFromBuffer(
                cacheKey,
                result.data as ArrayBuffer,
            )
        }
    }

    /**
     * Rasterize SVG to a SkiaImage.
     * If width/height/scale provided, rasterizes at that size.
     * Otherwise uses natural dimensions.
     */
    private async rasterizeSvg(
        svgString: string,
        cacheKey: string,
        width?: number,
        height?: number,
        scale: number = 1,
    ): Promise<SkiaImage | null> {
        return new Promise((resolve) => {
            try {
                const blob = new Blob([svgString], { type: 'image/svg+xml' })
                const blobUrl = URL.createObjectURL(blob)

                const img = new window.Image()
                img.src = blobUrl

                img.onload = async () => {
                    URL.revokeObjectURL(blobUrl)

                    if (this.invalidatedKeys.has(cacheKey)) {
                        this.invalidatedKeys.delete(cacheKey)
                        resolve(null)
                        return
                    }

                    try {
                        let w: number
                        let h: number

                        if (width && height) {
                            let scaledWidth = Math.ceil(width * scale)
                            let scaledHeight = Math.ceil(height * scale)

                            const maxDimension = Math.max(
                                scaledWidth,
                                scaledHeight,
                            )
                            if (maxDimension > MAX_SVG_RASTER_SIZE) {
                                const ratio = MAX_SVG_RASTER_SIZE / maxDimension
                                scaledWidth = Math.floor(scaledWidth * ratio)
                                scaledHeight = Math.floor(scaledHeight * ratio)
                            }

                            w = Math.max(1, scaledWidth)
                            h = Math.max(1, scaledHeight)
                        } else {
                            w = img.naturalWidth || 256
                            h = img.naturalHeight || 256
                        }

                        const canvas = new OffscreenCanvas(w, h)
                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                            resolve(null)
                            return
                        }

                        ctx.drawImage(img, 0, 0, w, h)
                        const imageData = ctx.getImageData(0, 0, w, h)

                        const skImage = this.createTextureFromPixels(
                            cacheKey,
                            imageData.data,
                            w,
                            h,
                        )
                        resolve(skImage)
                    } catch (error) {
                        console.error('failed to rasterize svg:', error)
                        resolve(null)
                    }
                }

                img.onerror = () => {
                    URL.revokeObjectURL(blobUrl)
                    console.error('failed to load svg for rasterization')
                    resolve(null)
                }
            } catch (error) {
                console.error('failed to rasterize svg:', error)
                resolve(null)
            }
        })
    }

    /**
     * Create a SkiaImage texture from raw bytes and cache it
     */
    private createTextureFromBuffer(
        cacheKey: string,
        buffer: ArrayBuffer,
    ): SkiaImage | null {
        const image = canvasKit.MakeImageFromEncoded(buffer)
        if (!image) {
            console.error(`failed to decode image: ${cacheKey}`)
            return null
        }

        // use actual GPU memory size (width × height × 4 bytes per pixel)
        const imageInfo = image.getImageInfo()
        const size = imageInfo.width * imageInfo.height * 4

        // evict if necessary before adding
        this.evictIfNeeded(size)

        // cache the texture
        this.cache.set(cacheKey, {
            image,
            size,
            lastUsed: Date.now(),
        })
        this.currentMemory += size

        return image
    }

    /**
     * Create a SkiaImage texture from raw pixel data and cache it
     */
    private createTextureFromPixels(
        cacheKey: string,
        pixels: Uint8ClampedArray,
        width: number,
        height: number,
    ): SkiaImage | null {
        const image = canvasKit.MakeImage(
            {
                width,
                height,
                colorType: canvasKit.ColorType.RGBA_8888,
                alphaType: canvasKit.AlphaType.Unpremul,
                colorSpace: canvasKit.ColorSpace.SRGB,
            },
            pixels,
            width * 4, // bytes per row
        )

        if (!image) {
            console.error(`failed to create image from pixels: ${cacheKey}`)
            return null
        }

        const size = width * height * 4

        // evict if necessary before adding
        this.evictIfNeeded(size)

        // cache the texture
        this.cache.set(cacheKey, {
            image,
            size,
            lastUsed: Date.now(),
        })
        this.currentMemory += size

        return image
    }

    /**
     * Evict oldest textures if adding new texture would exceed memory limit
     */
    private evictIfNeeded(incomingSize: number): void {
        if (this.currentMemory + incomingSize <= this.maxMemory) {
            return
        }

        // sort entries by lastUsed (oldest first)
        const entries = Array.from(this.cache.entries()).sort(
            (a, b) => a[1].lastUsed - b[1].lastUsed,
        )

        for (const [key, entry] of entries) {
            if (this.currentMemory + incomingSize <= this.maxMemory) {
                break
            }

            // delete the texture
            if (!entry.image.isDeleted()) {
                entry.image.delete()
            }
            this.currentMemory -= entry.size
            this.cache.delete(key)
        }
    }

    /**
     * Invalidate a specific texture by URL (handles all size variants)
     */
    invalidate(url: string): void {
        // mark as invalidated to prevent zombie cache entries from pending requests
        for (const key of this.pendingRequests.keys()) {
            if (key === url || key.startsWith(`${url}:`)) {
                this.invalidatedKeys.add(key)
            }
        }

        // invalidate all cache entries for this URL (and any size variants)
        for (const [key, entry] of this.cache) {
            if (key === url || key.startsWith(`${url}:`)) {
                if (!entry.image.isDeleted()) {
                    entry.image.delete()
                }
                this.currentMemory -= entry.size
                this.cache.delete(key)
            }
        }
    }

    /**
     * Check if a texture is cached
     */
    has(url: string): boolean {
        const entry = this.cache.get(url)
        return !!entry && !entry.image.isDeleted()
    }

    /**
     * Get current memory usage in bytes
     */
    getMemoryUsage(): number {
        return this.currentMemory
    }

    /**
     * Set maximum memory limit in bytes
     */
    setMaxMemory(bytes: number): void {
        this.maxMemory = bytes
        // trigger eviction if we're now over limit
        this.evictIfNeeded(0)
    }

    /**
     * Clean up all textures
     */
    dispose(): void {
        for (const [, entry] of this.cache) {
            if (!entry.image.isDeleted()) {
                entry.image.delete()
            }
        }
        this.cache.clear()
        this.pendingRequests.clear()
        this.invalidatedKeys.clear()
        this.currentMemory = 0
    }
}
