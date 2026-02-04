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

export class TextureManager extends Service {
    private cache: Map<string, CacheEntry> = new Map()
    private pendingRequests: Map<string, Promise<SkiaImage | null>> = new Map()
    private invalidatedKeys: Set<string> = new Set() // track invalidated keys during fetch
    private currentMemory: number = 0
    private maxMemory: number = 512 * 1024 * 1024 // 512MB

    private imageLoadingService: ImageLoadingService

    constructor(engine: Engine, imageLoadingService: ImageLoadingService) {
        super(engine)
        this.imageLoadingService = imageLoadingService
    }

    /**
     * Get a texture for a given URL. Returns cached texture if available,
     * otherwise fetches and creates a new texture.
     * For SVGs, pass original width/height from variation data for proper rasterization.
     */
    async getTexture(url: string, svgWidth?: number, svgHeight?: number): Promise<SkiaImage | null> {
        // for SVGs, use composite key with dimensions to avoid collisions
        const cacheKey = svgWidth && svgHeight 
            ? `${url}:${Math.ceil(svgWidth)}x${Math.ceil(svgHeight)}` 
            : url

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
        const request = this.fetchAndCreateTexture(url, cacheKey, svgWidth, svgHeight)
        this.pendingRequests.set(cacheKey, request)

        try {
            return await request
        } finally {
            this.pendingRequests.delete(cacheKey)
        }
    }

    private async fetchAndCreateTexture(
        url: string,
        cacheKey: string,
        svgWidth?: number,
        svgHeight?: number
    ): Promise<SkiaImage | null> {
        // fetch from ImageLoadingService
        const result = await this.imageLoadingService.loadImage(url)
        
        // check if invalidated during fetch (race condition guard)
        if (this.invalidatedKeys.has(cacheKey)) {
            this.invalidatedKeys.delete(cacheKey)
            return null
        }
        
        if (!result) {
            return null
        }

        // if svg, rasterize it
        if (result.isSvg) {
            const width = svgWidth || 256
            const height = svgHeight || 256
            return this.rasterizeSvg(result.data as string, cacheKey, width, height)
        } else {
            // raster image: decode directly
            return this.createTextureFromBuffer(cacheKey, result.data as ArrayBuffer)
        }
    }

    /**
     * Rasterize SVG text to a SkiaImage at specified dimensions
     */
    private async rasterizeSvg(
        svgString: string,
        cacheKey: string,
        width: number,
        height: number
    ): Promise<SkiaImage | null> {
        return new Promise((resolve) => {
            try {
                // create a blob URL for the SVG
                const blob = new Blob([svgString], { type: 'image/svg+xml' })
                const blobUrl = URL.createObjectURL(blob)
                
                const w = Math.max(1, Math.ceil(width))
                const h = Math.max(1, Math.ceil(height))
                
                const img = new window.Image()
                img.src = blobUrl
                
                img.onload = async () => {
                    URL.revokeObjectURL(blobUrl)
                    
                    // check if invalidated during load
                    if (this.invalidatedKeys.has(cacheKey)) {
                        this.invalidatedKeys.delete(cacheKey)
                        resolve(null)
                        return
                    }
                    
                    try {
                        const canvas = new OffscreenCanvas(w, h)
                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                            resolve(null)
                            return
                        }
                        
                        ctx.drawImage(img, 0, 0, w, h)
                        
                        const pngBlob = await canvas.convertToBlob({ type: 'image/png' })
                        const buffer = await pngBlob.arrayBuffer()
                        
                        const skImage = this.createTextureFromBuffer(cacheKey, buffer)
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
    private createTextureFromBuffer(cacheKey: string, buffer: ArrayBuffer): SkiaImage | null {
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
            lastUsed: Date.now()
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
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed)

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
