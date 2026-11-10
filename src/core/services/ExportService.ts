import { Service } from './Service'
import { canvasKit } from '../canvas/Canvas'
import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { SelectionService } from './SelectionService'
import { isIOS } from '@/helpers/Platform'

export type ExportOptions = {
    widgets: Widget[]
    scale: number
    background: boolean
    padding?: number
}

const PADDING = 24
// keeps the bitmap around 128mb at most
const MAX_SIDE = 8192
// ios safari can't encode canvases over 16.7m pixels
const maxPixels = () => (isIOS() ? 16 : 32) * 1024 * 1024

export class ExportService extends Service {
    // in z-order, the layer keeps its children sorted
    getWidgets(onlySelected = false) {
        const widgets = this.engine.stage.widgetsDefaultLayer.childrenArray.filter(
            (child): child is Widget =>
                child instanceof Widget && child.visible,
        )
        if (!onlySelected) return widgets

        const { selected } =
            this.engine.getService<SelectionService>('selection')
        return widgets.filter((w) => selected.includes(w))
    }

    // pixel size of the image, after the size limits
    getSize(widgets: Widget[], scale: number) {
        const bounds = this.getBounds(widgets, PADDING)
        return bounds && this.fit(bounds, scale)
    }

    private getBounds(widgets: Widget[], padding: number) {
        if (!widgets.length) return null

        const b = BoundingBox.createWithMerge(
            ...widgets.map((w) => w.renderBounds),
        )
        return new BoundingBox(
            b.x - padding,
            b.y - padding,
            b.width + padding * 2,
            b.height + padding * 2,
        )
    }

    private fit(bounds: BoundingBox, scale: number) {
        // rounding up can add a row and a column on top of the area
        const area = maxPixels() - 2 * MAX_SIDE - 1
        const max = Math.min(
            MAX_SIDE / bounds.width,
            MAX_SIDE / bounds.height,
            Math.sqrt(area / (bounds.width * bounds.height)),
        )
        scale = Math.min(scale, max)

        return {
            scale,
            width: Math.max(1, Math.ceil(bounds.width * scale)),
            height: Math.max(1, Math.ceil(bounds.height * scale)),
        }
    }

    // rgba pixels
    toPixels({ widgets, scale, background, padding = PADDING }: ExportOptions) {
        const bounds = this.getBounds(widgets, padding)
        if (!bounds) return null

        const size = this.fit(bounds, scale)
        const surface = canvasKit.MakeSurface(size.width, size.height)
        if (!surface) return null

        try {
            const ctx = surface.getCanvas()
            ctx.clear(background ? canvasKit.WHITE : canvasKit.TRANSPARENT)
            ctx.scale(size.scale, size.scale)
            ctx.translate(-bounds.x, -bounds.y)

            // board zoom, so images keep the texture they already have
            const renderContext = { ctx, scale: this.engine.canvas.zoom }
            for (const widget of widgets) {
                ctx.save()
                widget.render(renderContext)
                ctx.restore()
            }

            const data = ctx.readPixels(0, 0, {
                width: size.width,
                height: size.height,
                colorType: canvasKit.ColorType.RGBA_8888,
                alphaType: canvasKit.AlphaType.Unpremul,
                colorSpace: canvasKit.ColorSpace.SRGB,
            }) as Uint8Array | null

            return data && { width: size.width, height: size.height, data }
        } finally {
            surface.delete()
        }
    }

    // the browser encodes off the main thread, skia's encoder blocks it
    async toPng(options: ExportOptions): Promise<Blob> {
        const pixels = this.toPixels(options)
        if (!pixels) throw new Error('nothing to export')

        const { width, height, data } = pixels
        // same memory, no copy
        const rgba = new Uint8ClampedArray(
            data.buffer as ArrayBuffer,
            data.byteOffset,
            data.byteLength,
        )
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error(`no 2d context for ${width}x${height}`)

        ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
        return canvas.convertToBlob({ type: 'image/png' })
    }

    async copy(options: ExportOptions) {
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': this.toPng(options) }),
        ])
    }
}
