import { describe, it, expect, beforeEach } from 'vitest'
import { DistributeCommand } from '../Distribute'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (list: Widget[], axis: 'x' | 'y' = 'x') =>
    createCommandCtx(engine, { selected: list, params: { axis } })

// rects are 100x50
const rectAt = (x: number, y: number, width = 100, height = 50) => {
    const rect = makeRect(engine)
    rect.width = width
    rect.height = height
    rect.move(x, y)
    return rect
}

describe('DistributeCommand', () => {
    let command: DistributeCommand

    beforeEach(() => {
        engine = createEngineMock()
        command = new DistributeCommand()
    })

    it('needs three widgets', () => {
        expect(
            command.canExecute(makeCtx([rectAt(0, 0), rectAt(200, 0)])),
        ).toBe(false)
        expect(
            command.canExecute(
                makeCtx([rectAt(0, 0), rectAt(200, 0), rectAt(400, 0)]),
            ),
        ).toBe(true)
    })

    it('makes the gaps equal and keeps the ends', () => {
        const a = rectAt(0, 0)
        const b = rectAt(120, 30)
        const c = rectAt(500, 0)

        command.execute(makeCtx([a, b, c]))

        // 600 wide, 300 used, two gaps of 150
        expect([a.left, b.left, c.left]).toEqual([0, 250, 500])
        expect(b.top).toBe(30)
    })

    it('spaces edges, not centers', () => {
        const a = rectAt(0, 0)
        const wide = rectAt(150, 0, 300)
        const c = rectAt(600, 0)

        command.execute(makeCtx([a, wide, c]))

        // 700 wide, 500 used, two gaps of 100
        expect([a.left, wide.left, c.left]).toEqual([0, 200, 600])
    })

    it('orders by position, not by selection', () => {
        const a = rectAt(0, 0)
        const b = rectAt(120, 0)
        const c = rectAt(500, 0)

        command.execute(makeCtx([c, a, b]))

        expect([a.left, b.left, c.left]).toEqual([0, 250, 500])
    })

    it('distributes vertically', () => {
        const a = rectAt(0, 0)
        const b = rectAt(40, 60)
        const c = rectAt(0, 400)

        command.execute(makeCtx([a, b, c], 'y'))

        // 450 tall, 150 used, two gaps of 150
        expect([a.top, b.top, c.top]).toEqual([0, 200, 400])
        expect(b.left).toBe(40)
    })

    it('spaces centers when they do not fit', () => {
        // a row, distributed across it
        const a = rectAt(0, 400, 100, 60)
        const tall = rectAt(150, 380, 100, 180)
        const thin = rectAt(300, 420, 100, 30)
        const square = rectAt(450, 390, 100, 110)

        command.execute(makeCtx([a, tall, thin, square], 'y'))

        const centers = [a, thin, square, tall].map((w) => w.bounds.centerY)
        centers.forEach((c, i) => expect(c).toBeCloseTo(430 + (40 / 3) * i))
        for (const w of [a, tall, thin, square]) {
            expect(w.top).toBeGreaterThanOrEqual(380)
            expect(w.bounds.bottom).toBeLessThanOrEqual(560)
        }
    })

    it('keeps a repeated distribute out of the history', () => {
        const list = [rectAt(0.3, 0), rectAt(117.1, 0), rectAt(533.9, 0)]

        command.execute(makeCtx(list))
        command.execute(makeCtx(list))

        expect(engine.transactionHandler.commit).toHaveBeenLastCalledWith(
            'tx-2',
            false,
        )
    })

    it('keeps an even selection out of the history', () => {
        const list = [rectAt(0, 0), rectAt(200, 0), rectAt(400, 0)]

        command.execute(makeCtx(list))

        expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
            'tx-1',
            false,
        )
    })
})
