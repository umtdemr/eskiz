import { describe, it, expect } from 'vitest'
import { ResizeHandler, ResizePosition } from '../ResizeHandler'
import { createEngineMock, makeRect } from '@/test/commandUtils'
import type { CanvasMouseEvent } from '@/core/engine/Engine'

const at = (x: number, y: number) =>
    ({
        pointer: { x, y },
        e: { shiftKey: false },
    }) as unknown as CanvasMouseEvent

const setup = (isGridSnapEnabled: boolean) => {
    const engine = createEngineMock()
    engine.settings.set({ isGridSnapEnabled })
    // 100 x 50 at 0, 0
    const rect = makeRect(engine)
    return { rect, handler: new ResizeHandler(engine) }
}

describe('ResizeHandler', () => {
    it('follows the pointer', () => {
        const { rect, handler } = setup(false)

        handler.start(at(100, 50), rect, ResizePosition.CORNER_BOTTOM_RIGHT)
        handler.handle(at(133, 57))

        expect([rect.width, rect.height]).toEqual([133, 57])
    })

    it('puts the dragged corner on the grid when snapping', () => {
        const { rect, handler } = setup(true)

        // grabbed 2px inside the corner
        handler.start(at(98, 48), rect, ResizePosition.CORNER_BOTTOM_RIGHT)
        handler.handle(at(131, 55))

        expect([rect.width, rect.height]).toEqual([130, 60])
    })

    it('snaps only the axis of the dragged edge', () => {
        const { rect, handler } = setup(true)

        handler.start(at(0, 25), rect, ResizePosition.EDGE_LEFT)
        handler.handle(at(-17, 31))

        expect([rect.left, rect.width, rect.height]).toEqual([-20, 120, 50])
    })
})
