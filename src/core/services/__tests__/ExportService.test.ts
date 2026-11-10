import { describe, it, expect, vi, afterEach } from 'vitest'
import { ExportService, type ExportOptions } from '../ExportService'
import { Rectangle } from '@/core/shapes/Rectangle'
import { Line } from '@/core/shapes/line/Line'
import { createEngineStub, isColor, isTransparent } from '@/test/testUtils'
import { createEngineMock, createSelectionService } from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

const red = { r: 255, g: 0, b: 0, a: 1 }
const white = { r: 255, g: 255, b: 255, a: 1 }
const black = { r: 0, g: 0, b: 0, a: 1 }

const rect = (x: number, y: number, width = 100, height = 50, z = 'a0') =>
    new Rectangle(
        { x, y, width, height, z_index: z, properties: { fillColor: red } },
        createEngineStub(),
    )

const setup = (widgets: Widget[], selected: Widget[] = []) => {
    const services: Record<string, unknown> = {}
    const engine = createEngineMock(services)
    Object.assign(engine.canvas, { zoom: 1 })
    Object.assign(engine, {
        stage: { widgetsDefaultLayer: { childrenArray: widgets } },
    })
    services.selection = createSelectionService(engine, selected)
    return new ExportService(engine)
}

const render = (service: ExportService, options: ExportOptions) => {
    const { width, height, data } = service.toPixels(options)!
    const at = (x: number, y: number) => {
        const i = (y * width + x) * 4
        return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
    }
    return { width, height, at }
}

const stubEncoder = () => {
    vi.stubGlobal('ImageData', class {})
    vi.stubGlobal(
        'OffscreenCanvas',
        class {
            getContext() {
                return { putImageData: () => {} }
            }
            async convertToBlob({ type }: { type: string }) {
                return new Blob([], { type })
            }
        },
    )
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

    it('skips hidden widgets', () => {
        const a = rect(0, 0)
        const b = rect(200, 0, 100, 50, 'a1')
        b.visible = false
        const service = setup([a, b], [a, b])

        expect(service.getWidgets()).toEqual([a])
        expect(service.getWidgets(true)).toEqual([a])
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
            service.toPixels({ widgets: [], scale: 1, background: true }),
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
        const png = render(service, {
            widgets: [widget],
            scale: 2,
            background: true,
        })

        expect([png.width, png.height]).toEqual([296, 196])
        expect(isColor(png.at(2, 2), white)).toBe(true)
        expect(isColor(png.at(148, 98), red)).toBe(true)
    })

    it('crops tight without padding', () => {
        const widget = rect(0, 0)
        const service = setup([widget])
        const png = render(service, {
            widgets: [widget],
            scale: 1,
            background: false,
            padding: 0,
        })

        expect([png.width, png.height]).toEqual([100, 50])
    })

    it('keeps the stroke of a flat line', () => {
        const line = new Line(
            {
                x: 0,
                y: 0,
                width: 100,
                height: 0,
                properties: {
                    points: [
                        [0, 0],
                        [100, 0],
                    ],
                    strokeWidth: 4,
                },
            },
            createEngineStub(),
        )
        const service = setup([line])
        const png = render(service, {
            widgets: [line],
            scale: 1,
            background: false,
            padding: 0,
        })

        expect([png.width, png.height]).toEqual([104, 4])
        expect(isColor(png.at(52, 2), black)).toBe(true)
    })

    it('caps the pixels on ios', () => {
        vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5 })
        const service = setup([])
        const size = service.getSize([rect(0, 0, 6000, 5000)], 1)!
        vi.unstubAllGlobals()

        expect(size.width * size.height).toBeLessThanOrEqual(16 * 1024 * 1024)
    })

    it('leaves the background transparent', () => {
        const widget = rect(0, 0)
        const service = setup([widget])
        const png = render(service, {
            widgets: [widget],
            scale: 1,
            background: false,
        })

        expect(isTransparent(png.at(2, 2))).toBe(true)
    })

    describe('copy', () => {
        afterEach(() => {
            vi.unstubAllGlobals()
        })

        const stubClipboard = (write: () => Promise<void>) => {
            stubEncoder()
            // like the browser, waits for the png and fails with it
            const clipboard = {
                write: vi.fn(
                    async ([item]: {
                        items: Record<string, Promise<Blob>>
                    }[]) => {
                        await item.items['image/png']
                        await write()
                    },
                ),
            }
            vi.stubGlobal('navigator', { clipboard })
            vi.stubGlobal(
                'ClipboardItem',
                class {
                    constructor(public items: Record<string, Promise<Blob>>) {}
                },
            )
            return navigator.clipboard.write as ReturnType<typeof vi.fn>
        }

        it('writes a png', async () => {
            const write = stubClipboard(async () => {})
            const widget = rect(0, 0)
            const service = setup([widget])

            await service.copy({
                widgets: [widget],
                scale: 1,
                background: true,
            })
            const [[item]] = write.mock.calls[0]
            expect((await item.items['image/png']).type).toBe('image/png')
        })

        it('fails with nothing to copy', async () => {
            stubClipboard(async () => {})
            const service = setup([])

            await expect(
                service.copy({ widgets: [], scale: 1, background: true }),
            ).rejects.toThrow('nothing to export')
        })

        it('fails when the clipboard fails', async () => {
            stubClipboard(async () => {
                throw new Error('denied')
            })
            const widget = rect(0, 0)
            const service = setup([widget])

            await expect(
                service.copy({
                    widgets: [widget],
                    scale: 1,
                    background: true,
                }),
            ).rejects.toThrow('denied')
        })
    })
})
