import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MouseController } from '../MouseController'
import type { Engine } from '../Engine'

type Handler = (e: Partial<PointerEvent>) => void

let handlers: Record<string, Handler>
let controller: MouseController
let upper: ReturnType<typeof listen>
let tick: () => void
let removeTick: ReturnType<typeof vi.fn>

const listen = () => ({
    addEventListener: vi.fn((type: string, fn: Handler) => {
        handlers[type] = fn
    }),
    removeEventListener: vi.fn(),
})

const pointer = (rest: Partial<PointerEvent> = {}) =>
    ({
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        clientX: 0,
        clientY: 0,
        timeStamp: 0,
        ...rest,
    }) as PointerEvent

// a mouse move with the left button held
const drag = (rest: Partial<PointerEvent> = {}) =>
    pointer({ button: -1, buttons: 1, ...rest })

const touch = (
    pointerId: number,
    clientX: number,
    clientY: number,
    isPrimary = pointerId === 1,
) =>
    pointer({
        pointerId,
        pointerType: 'touch',
        isPrimary,
        clientX,
        clientY,
    })

describe('MouseController', () => {
    beforeEach(() => {
        handlers = {}
        removeTick = vi.fn()
        vi.stubGlobal('document', listen())
        upper = listen()
        const engine = {
            upperCanvasEl: upper,
            canvas: {
                tick: {
                    add: vi.fn((fn: () => void, ctx: unknown) => {
                        tick = fn.bind(ctx)
                    }),
                    remove: removeTick,
                },
                getPointer: (e: PointerEvent) => ({
                    x: e.clientX,
                    y: e.clientY,
                }),
            },
        }
        controller = new MouseController()
        controller.start(engine as unknown as Engine)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('emits down, move and up for a mouse drag', () => {
        const events: string[] = []
        controller.on('mouseDown', () => void events.push('down'))
        controller.on('mouseMove', () => void events.push('move'))
        controller.on('mouseUp', () => void events.push('up'))

        handlers.pointerdown(pointer())
        handlers.pointermove(drag({ clientX: 20, clientY: 20 }))
        tick()
        handlers.pointerup(pointer({ clientX: 20, clientY: 20 }))

        expect(events).toEqual(['down', 'move', 'up'])
    })

    it('ignores the right button', () => {
        const down = vi.fn()
        controller.on('mouseDown', down)

        handlers.pointerdown(pointer({ button: 2 }))

        expect(down).not.toHaveBeenCalled()
        expect(controller.isMouseDown).toBe(false)
    })

    it('holds a touch down until the finger moves', () => {
        const down = vi.fn()
        controller.on('mouseDown', down)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove(touch(1, 12, 10))
        expect(down).not.toHaveBeenCalled()

        handlers.pointermove({ ...touch(1, 30, 10), timeStamp: 200 })
        expect(down).toHaveBeenCalledOnce()
        expect(down.mock.calls[0][0].e.clientX).toBe(10)
        expect(controller.isMouseDown).toBe(true)
    })

    it('sends down and up for a tap', () => {
        const events: string[] = []
        controller.on('mouseDown', () => void events.push('down'))
        controller.on('mouseUp', () => void events.push('up'))

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointerup(touch(1, 10, 10))

        expect(events).toEqual(['down', 'up'])
    })

    it('sends nothing to tools for a pinch', () => {
        const down = vi.fn()
        const up = vi.fn()
        controller.on('mouseDown', down)
        controller.on('mouseUp', up)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointerdown(touch(2, 30, 10))
        handlers.pointerup(touch(2, 30, 10))
        handlers.pointerup(touch(1, 10, 10))

        expect(down).not.toHaveBeenCalled()
        expect(up).not.toHaveBeenCalled()
    })

    it('cancels the drag when a second finger lands', () => {
        const up = vi.fn()
        const cancel = vi.fn()
        controller.on('mouseUp', up)
        controller.on('mouseCancel', cancel)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove({ ...touch(1, 30, 10), timeStamp: 200 })
        handlers.pointerdown(touch(2, 60, 10))

        expect(cancel).toHaveBeenCalledOnce()
        expect(up).not.toHaveBeenCalled()
        expect(controller.isMouseDown).toBe(false)
    })

    it('emits pinch with scale and center shift', () => {
        const pinch = vi.fn()
        controller.on('pinch', pinch)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.pointermove(touch(2, 200, 0))
        tick()

        expect(pinch).toHaveBeenCalledWith({
            x: 100,
            y: 0,
            scale: 2,
            dx: 50,
            dy: 0,
        })
    })

    it('ignores the last finger after a pinch', () => {
        const down = vi.fn()
        const move = vi.fn()
        controller.on('mouseDown', down)
        controller.on('mouseMove', move)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.pointerup(touch(2, 100, 0))
        handlers.pointermove(touch(1, 50, 50))
        tick()

        expect(down).not.toHaveBeenCalled()
        expect(move).not.toHaveBeenCalled()
    })

    it('goes back to normal once all fingers are up', () => {
        const down = vi.fn()
        controller.on('mouseDown', down)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.pointerup(touch(2, 100, 0))
        handlers.pointerup(touch(1, 0, 0))
        handlers.pointerdown(touch(3, 0, 0, true))
        handlers.pointerup(touch(3, 0, 0, true))

        expect(down).toHaveBeenCalledOnce()
    })

    it('emits double click for two quick taps', () => {
        const dbl = vi.fn()
        controller.on('doubleClick', dbl)

        for (let i = 0; i < 2; i++) {
            handlers.pointerdown(touch(1, 10, 10))
            handlers.pointerup(touch(1, 10, 10))
        }

        expect(dbl).toHaveBeenCalledOnce()
    })

    it('ignores palm touches while a pen draws', () => {
        const move = vi.fn()
        const up = vi.fn()
        controller.on('mouseMove', move)
        controller.on('mouseUp', up)

        handlers.pointerdown(pointer({ pointerType: 'pen' }))
        handlers.pointerdown(touch(2, 50, 50, true))
        handlers.pointerdown(touch(3, 60, 50))
        handlers.pointermove(touch(2, 80, 80, true))
        tick()

        expect(move).not.toHaveBeenCalled()
        expect(up).not.toHaveBeenCalled()
        expect(controller.isMouseDown).toBe(true)
    })

    it('does not count a cancelled touch as a click', () => {
        const dbl = vi.fn()
        const up = vi.fn()
        const cancel = vi.fn()
        controller.on('doubleClick', dbl)
        controller.on('mouseUp', up)
        controller.on('mouseCancel', cancel)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointerup(touch(1, 10, 10))
        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove({ ...touch(1, 30, 10), timeStamp: 200 })
        handlers.pointercancel({ ...touch(1, 30, 10), type: 'pointercancel' })

        expect(up).toHaveBeenCalledOnce()
        expect(cancel).toHaveBeenCalledOnce()
        expect(dbl).not.toHaveBeenCalled()
        expect(controller.isMouseDown).toBe(false)
    })

    it('does not jump when one of three fingers lifts', () => {
        const pinch = vi.fn()
        controller.on('pinch', pinch)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.pointerdown(touch(3, 300, 0))
        handlers.pointerup(touch(1, 0, 0))
        handlers.pointermove(touch(2, 100, 0))
        tick()

        expect(pinch).toHaveBeenLastCalledWith({
            x: 200,
            y: 0,
            scale: 1,
            dx: 0,
            dy: 0,
        })
    })

    it('emits one pinch per frame', () => {
        const pinch = vi.fn()
        controller.on('pinch', pinch)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.pointermove(touch(1, -50, 0))
        handlers.pointermove(touch(2, 150, 0))
        handlers.pointermove(pointer({ pointerId: 9 }))
        tick()
        tick()

        expect(pinch).toHaveBeenCalledOnce()
        expect(pinch.mock.calls[0][0].scale).toBe(2)
    })

    it('lets a pen take over from a resting palm', () => {
        const down = vi.fn()
        const cancel = vi.fn()
        controller.on('mouseDown', down)
        controller.on('mouseCancel', cancel)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove({ ...touch(1, 40, 10), timeStamp: 200 })
        handlers.pointerdown(pointer({ pointerId: 5, pointerType: 'pen' }))

        expect(cancel).toHaveBeenCalledOnce()
        expect(down).toHaveBeenCalledTimes(2)
        expect(down.mock.calls[1][0].e.pointerType).toBe('pen')
    })

    it('emits a straight drag once past the threshold', () => {
        const move = vi.fn()
        controller.on('mouseMove', move)

        handlers.pointerdown(pointer())
        handlers.pointermove(drag({ clientX: 1 }))
        tick()
        handlers.pointermove(drag({ clientX: 2 }))
        tick()
        expect(move).not.toHaveBeenCalled()

        handlers.pointermove(drag({ clientX: 6 }))
        tick()
        expect(move).toHaveBeenCalledOnce()
    })

    it('does not tap after a long press menu', () => {
        const down = vi.fn()
        const menu = vi.fn()
        controller.on('mouseDown', down)
        controller.on('contextMenu', menu)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.contextmenu({
            ...touch(1, 10, 10),
            preventDefault: vi.fn(),
        })
        handlers.pointerup(touch(1, 10, 10))

        expect(menu).toHaveBeenCalledOnce()
        expect(down).not.toHaveBeenCalled()
    })

    it('ignores a palm sliding after the pen lifts', () => {
        const move = vi.fn()
        controller.on('mouseMove', move)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointerdown(pointer({ pointerId: 5, pointerType: 'pen' }))
        handlers.pointerup(pointer({ pointerId: 5, pointerType: 'pen' }))
        handlers.pointermove(touch(1, 80, 80))
        tick()

        expect(move).not.toHaveBeenCalled()
    })

    it('waits for a second finger before dragging', () => {
        const down = vi.fn()
        const pinch = vi.fn()
        controller.on('mouseDown', down)
        controller.on('pinch', pinch)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove({ ...touch(1, 30, 10), timeStamp: 50 })
        handlers.pointerdown(touch(2, 100, 10))
        handlers.pointermove(touch(2, 170, 10))
        tick()

        expect(down).not.toHaveBeenCalled()
        expect(pinch).toHaveBeenCalledOnce()
    })

    it('sends the last move before the up and none after', () => {
        const events: string[] = []
        controller.on('mouseMove', () => void events.push('move'))
        controller.on('mouseUp', () => void events.push('up'))

        handlers.pointerdown(pointer())
        handlers.pointermove(drag({ clientX: 20 }))
        handlers.pointerup(pointer({ clientX: 20 }))
        tick()

        expect(events).toEqual(['move', 'up'])
    })

    it('clamps the scale for fingers almost touching', () => {
        const pinch = vi.fn()
        controller.on('pinch', pinch)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 1, 0))
        handlers.pointermove(touch(2, 0, 0))
        tick()
        handlers.pointermove(touch(2, 60, 0))
        tick()

        expect(pinch.mock.calls[0][0].scale).toBe(1)
        expect(pinch.mock.calls[1][0].scale).toBe(2)
    })

    it('ends a drag when left lets go while right is held', () => {
        const up = vi.fn()
        controller.on('mouseUp', up)

        handlers.pointerdown(pointer())
        handlers.pointermove(drag({ clientX: 20, buttons: 3 }))
        handlers.pointermove(pointer({ clientX: 20, buttons: 2 }))

        expect(up).toHaveBeenCalledOnce()
        expect(controller.isMouseDown).toBe(false)
    })

    it('presses left while right is held', () => {
        const down = vi.fn()
        controller.on('mouseDown', down)

        handlers.pointermove(
            pointer({ buttons: 3, target: upper as unknown as EventTarget }),
        )

        expect(down).toHaveBeenCalledOnce()
    })

    it('keeps a finger drag when the pen barrel lands', () => {
        const cancel = vi.fn()
        controller.on('mouseCancel', cancel)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.pointermove({ ...touch(1, 30, 10), timeStamp: 200 })
        handlers.pointerdown(
            pointer({ pointerId: 5, pointerType: 'pen', button: 2 }),
        )

        expect(cancel).not.toHaveBeenCalled()
        expect(controller.isMouseDown).toBe(true)
    })

    it('ignores the context menu during a pinch', () => {
        const menu = vi.fn()
        controller.on('contextMenu', menu)

        handlers.pointerdown(touch(1, 0, 0))
        handlers.pointerdown(touch(2, 100, 0))
        handlers.contextmenu({ ...touch(1, 0, 0), preventDefault: vi.fn() })

        expect(menu).not.toHaveBeenCalled()
    })

    it('keeps a resting finger on a mouse right click', () => {
        const down = vi.fn()
        controller.on('mouseDown', down)

        handlers.pointerdown(touch(1, 10, 10))
        handlers.contextmenu({ ...pointer(), preventDefault: vi.fn() })
        handlers.pointerup(touch(1, 10, 10))

        expect(down).toHaveBeenCalledOnce()
    })

    it('taps with a finger that is not primary', () => {
        const events: string[] = []
        controller.on('mouseDown', () => void events.push('down'))
        controller.on('mouseUp', () => void events.push('up'))

        handlers.pointerdown(touch(2, 10, 10, false))
        handlers.pointerup(touch(2, 10, 10, false))

        expect(events).toEqual(['down', 'up'])
    })

    it('can be disposed before start', () => {
        expect(() => new MouseController().dispose()).not.toThrow()
    })

    it('stops listening to ticks on dispose', () => {
        controller.dispose()

        expect(removeTick).toHaveBeenCalledWith(
            expect.any(Function),
            controller,
        )
    })
})
