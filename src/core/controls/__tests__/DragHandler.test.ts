import { describe, it, expect } from 'vitest'
import { DragHandler } from '../DragHandler'
import { createEngineMock, makeRect } from '@/test/commandUtils'
import type { CanvasMouseEvent } from '@/core/engine/Engine'

const at = (x: number, y: number) =>
    ({ pointer: { x, y } }) as unknown as CanvasMouseEvent

const setup = (isGridSnapEnabled: boolean) => {
    const engine = createEngineMock()
    engine.settings.set({ isGridSnapEnabled })
    const rect = makeRect(engine)
    rect.move(3, 4)
    return { engine, rect, handler: new DragHandler(engine) }
}

describe('DragHandler', () => {
    it('moves by the pointer delta', () => {
        const { rect, handler } = setup(false)

        handler.start(at(0, 0), [rect])
        handler.handle(at(12, 7))

        expect([rect.left, rect.top]).toEqual([15, 11])
    })

    it('puts the top left on the grid when snapping', () => {
        const { rect, handler } = setup(true)

        handler.start(at(0, 0), [rect])
        handler.handle(at(12, 7))

        expect([rect.left, rect.top]).toEqual([20, 10])
    })

    it('keeps the gaps of a group when snapping', () => {
        const { engine, rect, handler } = setup(true)
        const other = makeRect(engine)
        other.move(33, 54)

        handler.start(at(0, 0), [rect, other])
        handler.handle(at(12, 7))

        expect([rect.left, rect.top]).toEqual([20, 10])
        expect([other.left, other.top]).toEqual([50, 60])
    })
})
