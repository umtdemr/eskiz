import { Service } from './Service'
import { LocalAdapter } from '@/core/sync/LocalAdapter'

export interface ImageLoadResult {
    data: ArrayBuffer | string // ArrayBuffer for raster, string for SVG
    isSvg: boolean
}

const CACHE_NAME = 'wb-images-v1'

export class ImageLoadingService extends Service {
    private queue: {
        url: string
        resolve: (result: ImageLoadResult | null) => void
    }[] = []
    private activeRequests = 0
    private maxConcurrentRequests = 35
    private cache: Cache | null = null
    private cacheInitialized = false
    private cacheInitPromise: Promise<void> | null = null
    private localAdapter: LocalAdapter | null = null

    setLocalAdapter(adapter: LocalAdapter): void {
        this.localAdapter = adapter
    }

    private async ensureCacheInitialized(): Promise<void> {
        if (this.cacheInitialized) return

        if (!this.cacheInitPromise) {
            this.cacheInitPromise = this.initCache()
        }
        await this.cacheInitPromise
    }

    private async initCache(): Promise<void> {
        try {
            this.cache = await caches.open(CACHE_NAME)
        } catch (e) {
            console.warn('cache Storage not available:', e)
        }
        this.cacheInitialized = true
    }

    async loadImage(url: string): Promise<ImageLoadResult | null> {
        // ensure cache is initialized
        await this.ensureCacheInitialized()

        return new Promise((resolve) => {
            this.queue.push({ url, resolve })
            this.processQueue()
        })
    }

    private processQueue() {
        while (
            this.queue.length > 0 &&
            this.activeRequests < this.maxConcurrentRequests
        ) {
            this.activeRequests++
            const request = this.queue.shift()!
            this.performRequest(request)
        }
    }

    private async performRequest(request: {
        url: string
        resolve: (result: ImageLoadResult | null) => void
    }) {
        try {
            // handle idb:// URLs: load from IndexedDB
            if (request.url.startsWith('idb://')) {
                const uuid = request.url.slice('idb://'.length)
                if (!this.localAdapter) {
                    console.error('idb:// URL but no LocalAdapter available')
                    request.resolve(null)
                    return
                }
                const stored = await this.localAdapter.getImage(uuid)
                if (!stored) {
                    console.error(`image not found in IndexedDB: ${uuid}`)
                    request.resolve(null)
                    return
                }
                const isSvg = stored.mimeType.includes('svg')
                request.resolve({ data: stored.data, isSvg })
                return
            }

            // check cache first
            let response: Response | undefined

            if (this.cache) {
                response = await this.cache.match(request.url)
            }

            // if not in cache, fetch it
            if (!response) {
                response = await fetch(request.url)

                if (!response.ok) {
                    console.error(`failed to load image: ${request.url}`)
                    request.resolve(null)
                    return
                }

                // lone and store in cache (response can only be read once)
                if (this.cache) {
                    try {
                        await this.cache.put(request.url, response.clone())
                    } catch (e) {
                        console.warn('failed to cache image:', e)
                    }
                }
            }

            const contentType = response.headers.get('content-type') || ''
            const isSvg = contentType.includes('svg')

            // return text for svg, arraybuffer for raster
            const data = isSvg
                ? await response.text()
                : await response.arrayBuffer()

            request.resolve({ data, isSvg })
        } catch (error) {
            console.error(`Error loading image ${request.url}:`, error)
            request.resolve(null)
        } finally {
            this.activeRequests--
            this.processQueue()
        }
    }

    /**
     * Clear a specific URL from cache
     */
    async invalidate(url: string): Promise<void> {
        if (this.cache) {
            await this.cache.delete(url)
        }
    }

    /**
     * Clear all cached images
     */
    async clearCache(): Promise<void> {
        await caches.delete(CACHE_NAME)
        this.cache = await caches.open(CACHE_NAME)
    }
}
