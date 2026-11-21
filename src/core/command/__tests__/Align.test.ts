import { describe, it, expect, beforeEach } from 'vitest'
import { AlignCommand, AlignTo } from '../Align'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (list: Widget[], to: AlignTo = 'left') =>
    createCommandCtx(engine, { selected: list, params: { to } })

const rectAt = (x: number, y: number, locked = false) => {
    const rect = makeRect(engine, { locked })
    rect.move(x, y)
    return rect
}

describe('AlignCommand', () => {
    let command: AlignCommand

    beforeEach(() => {
        engine = createEngineMock()
        command = new AlignCommand()
    })

    describe('canExecute', () => {
        it('needs two widgets', () => {
            expect(command.canExecute(makeCtx([rectAt(0, 0)]))).toBe(false)
            expect(
                command.canExecute(makeCtx([rectAt(0, 0), rectAt(10, 10)])),
            ).toBe(true)
        })

        it('returns false when a widget is locked', () => {
            const list = [rectAt(0, 0), rectAt(10, 10, true)]
            expect(command.canExecute(makeCtx(list))).toBe(false)
        })

        it('does not count bound lines', () => {
            const line = makeLine(engine)
            line.headBinding = { id: 'other', rx: 0, ry: 0 }
            expect(command.canExecute(makeCtx([rectAt(0, 0), line]))).toBe(
                false,
            )
        })
    })

    describe('execute', () => {
        // rects are 100x50, the second one is at (200, 100)
        it.each<[AlignTo, number, number, number, number]>([
            ['left', 0, 0, 0, 100],
            ['centerX', 100, 0, 100, 100],
            ['right', 200, 0, 200, 100],
            ['top', 0, 0, 200, 0],
            ['centerY', 0, 50, 200, 50],
            ['bottom', 0, 100, 200, 100],
        ])('aligns to %s', (to, ax, ay, bx, by) => {
            const a = rectAt(0, 0)
            const b = rectAt(200, 100)

            command.execute(makeCtx([a, b], to))

            expect([a.left, a.top, b.left, b.top]).toEqual([ax, ay, bx, by])
        })

        it('uses the outer box of rotated widgets', () => {
            const a = rectAt(0, 0)
            const rotated = rectAt(300, 0)
            rotated.angle = Math.PI / 2

            command.execute(makeCtx([a, rotated], 'left'))

            expect(a.left).toBe(0)
            expect(rotated.bounds.left).toBeCloseTo(0)
        })

        it('leaves bound lines to their widgets', () => {
            const a = rectAt(0, 0)
            const b = rectAt(200, 100)
            const line = makeLine(engine)
            line.move(500, 500)
            line.headBinding = { id: 'other', rx: 0, ry: 0 }

            command.execute(makeCtx([a, b, line], 'left'))

            expect([line.left, line.top]).toEqual([500, 500])
            const [, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect([...editTable.keys()]).toEqual([a, b])
        })

        it('aligns free lines like other widgets', () => {
            const a = rectAt(0, 0)
            const line = makeLine(engine)
            line.move(300, 0)

            command.execute(makeCtx([a, line], 'left'))

            expect(line.left).toBe(0)
        })

        it('records the moves in one transaction', () => {
            const a = rectAt(0, 0)
            const b = rectAt(200, 100)

            command.execute(makeCtx([a, b], 'left'))

            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
            expect(engine.canvas.requestRender).toHaveBeenCalled()
        })

        it('keeps a repeated align out of the history', () => {
            const a = rectAt(0.1, 0)
            const b = rectAt(117.7, 50)
            b.width = 70.9

            command.execute(makeCtx([a, b], 'centerX'))
            command.execute(makeCtx([a, b], 'centerX'))

            expect(engine.transactionHandler.commit).toHaveBeenLastCalledWith(
                'tx-2',
                false,
            )
        })

        it('keeps an aligned selection out of the history', () => {
            const a = rectAt(0, 0)
            const b = rectAt(0, 100)

            command.execute(makeCtx([a, b], 'left'))

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                false,
            )
        })
    })
})
