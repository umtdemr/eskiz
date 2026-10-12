import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    ClipboardService,
    decodeWidgets,
    encodeWidgets,
} from '../ClipboardService'
import type { Engine } from '@/core/engine/Engine'
import type { MouseController } from '@/core/engine/MouseController'
import type { Widget, WidgetJson } from '@/core/shapes/Widget'

const json = (uuid: string) =>
    ({ uuid, x: 0, y: 0, width: 10, height: 10 }) as WidgetJson

const widget = (uuid: string, isLocked = false) =>
    ({ isLocked, toJson: () => json(uuid) }) as unknown as Widget

let engine: {
    textEditor: { isActive: boolean }
    canvas: {
        getPointer: ReturnType<typeof vi.fn>
        translateX: number
        translateY: number
        zoom: number
        canvasEl: { width: number; height: number }
    }
    getService: ReturnType<typeof vi.fn>
    execute: ReturnType<typeof vi.fn>
}
let selection: { selected: Widget[] }
let imageUpload: { upload: ReturnType<typeof vi.fn> }
let mouse: { isMouseDown: boolean; on: ReturnType<typeof vi.fn> }
let service: ClipboardService
let listeners: Record<string, (e: ClipboardEvent) => void>

const fire = (type: string, html = '', rest = {}, files: File[] = []) => {
    const data: Record<string, string> = { 'text/html': html }
    const e = {
        target: null,
        defaultPrevented: false,
        clipboardData: {
            setData: vi.fn((format: string, value: string) => {
                data[format] = value
            }),
            getData: (format: string) => data[format] ?? '',
            files,
        },
        preventDefault: vi.fn(),
        ...rest,
    }
    listeners[type](e as unknown as ClipboardEvent)
    return { e, data }
}

describe('encodeWidgets', () => {
    it('round trips', () => {
        const widgets = [json('a'), json('ü"<>')]
        expect(decodeWidgets(encodeWidgets(widgets))).toEqual(widgets)
    })

    it('finds the data inside other html', () => {
        const html = `<meta charset="utf-8">${encodeWidgets([json('a')])}`
        expect(decodeWidgets(html)).toEqual([json('a')])
    })

    it('returns null for other html', () => {
        expect(decodeWidgets('<b>hi</b>')).toBeNull()
        expect(decodeWidgets('<span data-eskiz="%7Bbroken"></span>')).toBeNull()
        expect(decodeWidgets(encodeWidgets([]))).toBeNull()
    })
})

describe('ClipboardService', () => {
    beforeEach(() => {
        listeners = {}
        vi.stubGlobal('document', {
            addEventListener: vi.fn(
                (type: string, fn: (e: ClipboardEvent) => void) => {
                    listeners[type] = fn
                },
            ),
            removeEventListener: vi.fn(),
        })
        selection = { selected: [widget('a'), widget('b')] }
        imageUpload = { upload: vi.fn() }
        engine = {
            textEditor: { isActive: false },
            canvas: {
                getPointer: vi.fn(() => ({ x: 5, y: 6 })),
                translateX: -100,
                translateY: -200,
                zoom: 2,
                canvasEl: { width: 800, height: 600 },
            },
            getService: vi.fn((name: string) =>
                name === 'imageUpload' ? imageUpload : selection,
            ),
            execute: vi.fn(() => true),
        }
        mouse = { isMouseDown: false, on: vi.fn(() => vi.fn()) }
        service = new ClipboardService(
            engine as unknown as Engine,
            mouse as unknown as MouseController,
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('copies the selection as html', () => {
        const { e, data } = fire('copy')

        expect(decodeWidgets(data['text/html'])).toEqual([json('a'), json('b')])
        expect(data['text/plain']).toBeUndefined()
        expect(e.preventDefault).toHaveBeenCalled()
        expect(engine.execute).not.toHaveBeenCalled()
    })

    it('copies nothing without a selection or with a locked widget', () => {
        selection.selected = []
        expect(fire('copy').e.preventDefault).not.toHaveBeenCalled()

        selection.selected = [widget('a'), widget('b', true)]
        expect(fire('copy').e.preventDefault).not.toHaveBeenCalled()
    })

    it('deletes the selection on cut', () => {
        const { data } = fire('cut')

        expect(decodeWidgets(data['text/html'])).toHaveLength(2)
        expect(engine.execute).toHaveBeenCalledWith('delete', {})
    })

    it('pastes at the middle of the screen before the mouse moved', () => {
        const { e } = fire('paste', encodeWidgets([json('a')]))

        expect(e.preventDefault).toHaveBeenCalled()
        expect(engine.execute).toHaveBeenCalledWith('paste', {
            widgets: [json('a')],
            at: { x: 300, y: 350 },
        })
    })

    it('pastes under the mouse', () => {
        const onMove = mouse.on.mock.calls[0][1]
        const mouseEvent = {}
        onMove({ e: mouseEvent })

        fire('paste', encodeWidgets([json('a')]))

        expect(engine.canvas.getPointer).toHaveBeenCalledWith(mouseEvent)
        expect(engine.execute).toHaveBeenCalledWith('paste', {
            widgets: [json('a')],
            at: { x: 5, y: 6 },
        })
    })

    it('uploads pasted images', () => {
        const png = { type: 'image/png' } as File
        const pdf = { type: 'application/pdf' } as File

        const { e } = fire('paste', '', {}, [png, pdf])

        expect(e.preventDefault).toHaveBeenCalled()
        expect(imageUpload.upload).toHaveBeenCalledWith([png], {
            x: 300,
            y: 350,
        })
    })

    it('prefers widgets over images', () => {
        const png = { type: 'image/png' } as File

        fire('paste', encodeWidgets([json('a')]), {}, [png])

        expect(engine.execute).toHaveBeenCalled()
        expect(imageUpload.upload).not.toHaveBeenCalled()
    })

    it('leaves other pastes to the browser', () => {
        const pdf = { type: 'application/pdf' } as File

        const { e } = fire('paste', '<b>hi</b>', {}, [pdf])

        expect(e.preventDefault).not.toHaveBeenCalled()
        expect(engine.execute).not.toHaveBeenCalled()
        expect(imageUpload.upload).not.toHaveBeenCalled()
    })

    it('ignores events in an input or while editing text', () => {
        const input = { tagName: 'INPUT', isContentEditable: false }
        fire('copy', '', { target: input })
        fire('paste', encodeWidgets([json('a')]), { target: input })

        engine.textEditor.isActive = true
        fire('cut')

        expect(engine.execute).not.toHaveBeenCalled()
    })

    it('stops listening on dispose', () => {
        service.dispose()

        for (const type of ['copy', 'cut', 'paste']) {
            expect(document.removeEventListener).toHaveBeenCalledWith(
                type,
                listeners[type],
            )
        }
    })
})
