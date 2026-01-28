import { Service } from './Service'
import { canvasKit } from '@/core/canvas/Canvas'
import { Image as SkiaImage } from 'canvaskit-wasm'

export class ImageLoadingService extends Service {
    private queue: {
        url: string
        resolve: (image: SkiaImage | null) => void
    }[] = []
    private activeRequests = 0
    private maxConcurrentRequests = 35

    async loadImage(url: string): Promise<SkiaImage | null> {
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
        resolve: (image: SkiaImage | null) => void
    }) {
        try {
            const res = await fetch(request.url)
            if (!res.ok) {
                console.error(`Failed to load image: ${request.url}`)
                request.resolve(null)
                return
            }
            const buf = await res.arrayBuffer()
            const img = canvasKit.MakeImageFromEncoded(buf)
            request.resolve(img)
        } catch (error) {
            console.error(`Error loading image ${request.url}:`, error)
            request.resolve(null)
        } finally {
            this.activeRequests--
            this.processQueue()
        }
    }
}
