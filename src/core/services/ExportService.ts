import { Service } from './Service'
import { canvasKit } from '../canvas/Canvas'
import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { SelectionService } from './SelectionService'

export type ExportOptions = {
    widgets: Widget[]
    scale: number
    background: boolean
}

const PADDING = 24
// keeps the bitmap around 128mb at most
const MAX_SIDE = 8192
const MAX_PIXELS = 32 * 1024 * 1024

export class ExportService extends Service {
    // in z-order
    getWidgets(onlySelected = false) {
        if (onlySelected) {
            const { selected } =
                this.engine.getService<SelectionService>('selection')
            return [...selected].sort((a, b) => (a.zIndex < b.zIndex ? -1 : 1))
        }

        return this.engine.stage.widgetsDefaultLayer.childrenArray.filter(
            (child): child is Widget =>
                child instanceof Widget && child.visible,
        )
    }

    // pixel size of the image, after the size limits
    getSize(widgets: Widget[], scale: number) {
        const bounds = this.getBounds(widgets, PADDING)
        return bounds && this.fit(bounds, scale)
    }

    private getBounds(widgets: Widget[], padding: number) {
        if (!widgets.length) return null

        const b = BoundingBox.createWithMerge(...widgets.map((w) => w.bounds))
        return new BoundingBox(
            b.x - padding,
            b.y - padding,
            b.width + padding * 2,
            b.height + padding * 2,
        )
    }

    private fit(bounds: BoundingBox, scale: number) {
        const max = Math.min(
            MAX_SIDE / bounds.width,
            MAX_SIDE / bounds.height,
            Math.sqrt(MAX_PIXELS / (bounds.width * bounds.height)),
        )
        scale = Math.min(scale, max)

        return {
            scale,
            width: Math.ceil(bounds.width * scale),
            height: Math.ceil(bounds.height * scale),
        }
    }

    toPng({ widgets, scale, background }: ExportOptions) {
        const bounds = this.getBounds(widgets, PADDING)
        if (!bounds) return null

        const size = this.fit(bounds, scale)
        const surface = canvasKit.MakeSurface(size.width, size.height)
        if (!surface) return null

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
        surface.flush()

        const image = surface.makeImageSnapshot()
        const bytes = image.encodeToBytes()
        image.delete()
        surface.delete()

        return bytes
    }
}
