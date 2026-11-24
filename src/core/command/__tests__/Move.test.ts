import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MoveCommand } from '../Move'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    list: Widget[],
    dx: number,
    dy: number,
    isContinuous = false,
) =>
    createCommandCtx(engine, {
        selected: list,
        isContinuous,
        params: { dx, dy },
    })

describe('MoveCommand', () => {
    let command: MoveCommand

    beforeEach(() => {
        engine = createEngineMock()
        command = new MoveCommand()
    })

    describe('canExecute', () => {
        it('returns false without widgets', () => {
            expect(command.canExecute(makeCtx([], 1, 0))).toBe(false)
        })

        it('returns false when a widget is locked', () => {
            const list = [makeRect(engine), makeRect(engine, { locked: true })]
            expect(command.canExecute(makeCtx(list, 1, 0))).toBe(false)
        })

        it('returns true for unlocked widgets', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)], 1, 0))).toBe(
                true,
            )
        })
    })

    describe('execute', () => {
        afterEach(() => {
            vi.useRealTimers()
        })

        it('moves every widget by the delta', () => {
            const a = makeRect(engine)
            const b = makeRect(engine)

            command.execute(makeCtx([a, b], 5, -3))

            expect([a.left, a.top, b.left, b.top]).toEqual([5, -3, 5, -3])
            expect(engine.canvas.requestRender).toHaveBeenCalled()
        })

        it('records the move in one transaction', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 1, 0))

            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[rect, ['move']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins before moving', () => {
            const rect = makeRect(engine)
            let leftAtBegin: number | undefined
            engine.transactionHandler.begin.mockImplementation(() => {
                leftAtBegin = rect.left
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect], 1, 0))

            expect(leftAtBegin).toBe(0)
            expect(rect.left).toBe(1)
        })

        it('joins continuous moves into one transaction', () => {
            vi.useFakeTimers()
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 1, 0, true))
            command.execute(makeCtx([rect], 1, 0, true))

            expect(rect.left).toBe(2)
            expect(engine.transactionHandler.begin).toHaveBeenCalledTimes(1)
            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'continuous',
                expect.anything(),
            )
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('keeps a zero move out of the history', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 0, 0))

            expect(rect.left).toBe(0)
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                false,
            )
        })

        it('carries the move to the next grid line when snapping', () => {
            engine.settings.set({ isGridSnapEnabled: true })
            const rect = makeRect(engine)
            rect.move(3, 4)

            command.execute(makeCtx([rect], 1, 0))
            expect([rect.left, rect.top]).toEqual([10, 4])

            command.execute(makeCtx([rect], 1, 0))
            expect(rect.left).toBe(20)

            command.execute(makeCtx([rect], 0, -1))
            expect(rect.top).toBe(0)
        })

        it('lands the group top left on the grid when snapping', () => {
            engine.settings.set({ isGridSnapEnabled: true })
            const a = makeRect(engine)
            const b = makeRect(engine)
            a.move(13, 0)
            b.move(31, 0)

            command.execute(makeCtx([a, b], -1, 0))

            expect([a.left, b.left]).toEqual([10, 28])
        })

        it('does nothing when a widget is locked', () => {
            const rect = makeRect(engine, { locked: true })

            command.execute(makeCtx([rect], 1, 0))

            expect(rect.left).toBe(0)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
