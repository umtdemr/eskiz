import { describe, it, expect, vi, afterEach } from 'vitest'
import { ExportService, type ExportOptions } from '../ExportService'
import { Rectangle } from '@/core/shapes/Rectangle'
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

const render = (service: ExportService, options: ExportOptions) => {
    const { width, height, data } = service.toPixels(options)!
    const at = (x: number, y: number) => {
        const i = (y * width + x) * 4
        return Array.from(data.slice(i, i + 4))
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
        expect(png.at(2, 2)).toEqual([255, 255, 255, 255])
        expect(png.at(148, 98)).toEqual([255, 0, 0, 255])
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

    it('leaves the background transparent', () => {
        const widget = rect(0, 0)
        const service = setup([widget])
        const png = render(service, {
            widgets: [widget],
            scale: 1,
            background: false,
        })

        expect(png.at(2, 2)[3]).toBe(0)
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

            expect(
                await service.copy({
                    widgets: [widget],
                    scale: 1,
                    background: true,
                }),
            ).toBe(true)
            const [[item]] = write.mock.calls[0]
            expect((await item.items['image/png']).type).toBe('image/png')
        })

        it('returns false with nothing to copy', async () => {
            stubClipboard(async () => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            const service = setup([])

            expect(
                await service.copy({ widgets: [], scale: 1, background: true }),
            ).toBe(false)
        })

        it('returns false when the clipboard fails', async () => {
            stubClipboard(async () => {
                throw new Error('denied')
            })
            vi.spyOn(console, 'error').mockImplementation(() => {})
            const widget = rect(0, 0)
            const service = setup([widget])

            expect(
                await service.copy({
                    widgets: [widget],
                    scale: 1,
                    background: true,
                }),
            ).toBe(false)
        })
    })
})
