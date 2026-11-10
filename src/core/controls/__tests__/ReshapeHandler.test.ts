import { describe, it, expect, vi } from 'vitest'
import { ReshapeHandler } from '../ReshapeHandler'
import { makeLine } from '@/test/commandUtils'
import type { CanvasMouseEvent, Engine } from '@/core/engine/Engine'

const setup = () => {
    const engine = {
        canvas: { requestRender: () => {} },
        transactionHandler: {
            begin: () => ({ transactionId: 't' }),
            update: vi.fn(),
            commit: vi.fn(),
            addEditingMethod: vi.fn(),
        },
        stage: {
            nonCanvasDynamicContainer: { magnetLayer: { update: () => {} } },
        },
    } as unknown as Engine
    const line = makeLine(engine)
    return { engine, line, handler: new ReshapeHandler(engine) }
}

const at = (x: number, y: number) =>
    ({ pointer: { x, y } }) as unknown as CanvasMouseEvent

describe('ReshapeHandler', () => {
    it('inserts a point between two points', () => {
        const { line, handler } = setup()
        const changed = vi.fn()
        line.pointCountChanged.add(changed)

        handler.start(at(50, 50), line, 1, [50, 50])

        expect(line.absolutePoints).toEqual([
            [0, 0],
            [50, 50],
            [100, 100],
        ])
        expect(changed).toHaveBeenCalledTimes(1)
    })

    it('drags the inserted point and keeps the ends', () => {
        const { engine, line, handler } = setup()

        handler.start(at(50, 50), line, 1, [50, 50])
        handler.handle(at(50, -20))
        handler.end(at(50, -20))

        expect(line.absolutePoints).toEqual([
            [0, 0],
            [50, -20],
            [100, 100],
        ])
        expect(line.top).toBe(-20)
        expect(engine.transactionHandler.commit).toHaveBeenCalledWith('t')
    })
})
