import { describe, it, expect } from 'vitest'
import { ExportService } from '../ExportService'
import { Rectangle } from '@/core/shapes/Rectangle'
import { canvasKit } from '@/core/canvas/Canvas'
import { createEngineStub } from '@/test/testUtils'
import type { Engine } from '@/core/engine/Engine'
import type { Widget } from '@/core/shapes/Widget'

const red = { r: 255, g: 0, b: 0, a: 1 }

const rect = (x: number, y: number, width = 100, height = 50, z = 'a0') =>
    new Rectangle(
        { x, y, width, height, z_index: z, properties: { fillColor: red } },
        createEngineStub(),
    )

const setup = (widgets: Widget[], selected: Widget[] = []) => {
    const engine = {
        canvas: { zoom: 1 },
        stage: { widgetsDefaultLayer: { childrenArray: widgets } },
        getService: () => ({ selected }),
    } as unknown as Engine
    return new ExportService(engine)
}

const decode = (bytes: Uint8Array) => {
    const image = canvasKit.MakeImageFromEncoded(bytes)!
    const width = image.width()
    const height = image.height()
    const pixels = image.readPixels(0, 0, {
        width,
        height,
        colorType: canvasKit.ColorType.RGBA_8888,
        alphaType: canvasKit.AlphaType.Unpremul,
        colorSpace: canvasKit.ColorSpace.SRGB,
    }) as Uint8Array
    image.delete()

    const at = (x: number, y: number) => {
        const i = (y * width + x) * 4
        return Array.from(pixels.slice(i, i + 4))
    }
    return { width, height, at }
}

describe('ExportService', () => {
    it('sorts selected by z-index', () => {
        const a = rect(0, 0, 100, 50, 'a0')
        const b = rect(200, 0, 100, 50, 'a1')
        const c = rect(400, 0, 100, 50, 'a2')
        const service = setup([a, b, c], [c, a])

        expect(service.getWidgets()).toEqual([a, b, c])
        expect(service.getWidgets(true)).toEqual([a, c])
    })

    it('pads the union of bounds', () => {
        const service = setup([])
        const size = service.getSize([rect(0, 0), rect(200, 100)], 1)

        expect(size).toEqual({ scale: 1, width: 348, height: 198 })
    })

    it('returns null for no widgets', () => {
        const service = setup([])

        expect(service.getSize([], 1)).toBeNull()
        expect(
            service.toPng({ widgets: [], scale: 1, background: true }),
        ).toBeNull()
    })

    it('shrinks the scale for huge boards', () => {
        const service = setup([])
        const size = service.getSize([rect(0, 0, 20000, 100)], 2)!

        expect(size.width).toBeLessThanOrEqual(8192)
        expect(size.scale).toBeLessThan(1)
    })

    it('renders at the given scale', () => {
        const widget = rect(0, 0)
        const service = setup([widget])
        const png = decode(
            service.toPng({ widgets: [widget], scale: 2, background: true })!,
        )

        expect([png.width, png.height]).toEqual([296, 196])
        expect(png.at(2, 2)).toEqual([255, 255, 255, 255])
        expect(png.at(148, 98)).toEqual([255, 0, 0, 255])
    })

    it('leaves the background transparent', () => {
        const widget = rect(0, 0)
        const service = setup([widget])
        const png = decode(
            service.toPng({ widgets: [widget], scale: 1, background: false })!,
        )

        expect(png.at(2, 2)[3]).toBe(0)
    })
})
