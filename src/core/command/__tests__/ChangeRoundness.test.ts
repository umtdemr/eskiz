import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeRoundness } from '../ChangeRoundness'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    roundness: number = 12,
    isContinuous = false,
) =>
    createCommandCtx(engine, {
        selected,
        isContinuous,
        params: { roundness },
    })

describe('ChangeRoundness', () => {
    let command: ChangeRoundness

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeRoundness()
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeRect(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for non rectangles', () => {
            expect(command.canExecute(makeCtx([makeLine(engine)]))).toBe(false)
        })

        it('returns true when a rectangle is selected with others', () => {
            const ctx = makeCtx([makeRect(engine), makeLine(engine)])
            expect(command.canExecute(ctx)).toBe(true)
        })

        it('returns true for rectangles', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(true)
        })
    })

    describe('execute (immediate)', () => {
        it('changes the radius', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect]))

            expect(rect.properties.radius).toBe(12)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[rect, ['roundness']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the radius changes', () => {
            const rect = makeRect(engine)
            let radiusAtBegin: unknown = 'unset'
            engine.transactionHandler.begin.mockImplementation(() => {
                radiusAtBegin = rect.properties.radius
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect]))

            expect(radiusAtBegin).toBeUndefined()
        })

        it('accepts zero', () => {
            const rect = makeRect(engine)
            command.execute(makeCtx([rect], 12))

            command.execute(makeCtx([rect], 0))

            expect(rect.properties.radius).toBe(0)
        })

        it('skips the render when the radius is unchanged', () => {
            const rect = makeRect(engine)
            command.execute(makeCtx([rect], 12))
            engine.canvas.requestRender.mockClear()

            command.execute(makeCtx([rect], 12))

            expect(engine.canvas.requestRender).not.toHaveBeenCalled()
        })

        it('changes every selected widget in one transaction', () => {
            const a = makeRect(engine)
            const b = makeRect(engine)

            command.execute(makeCtx([a, b]))

            expect(a.properties.radius).toBe(12)
            expect(b.properties.radius).toBe(12)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
        })
    })

    describe('execute (continuous)', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('reuses one transaction and commits once the changes settle', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 4, true))
            command.execute(makeCtx([rect], 8, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            expect(rect.properties.radius).toBe(8)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'continuous',
                expect.anything(),
            )
            expect(engine.transactionHandler.update).toHaveBeenCalledTimes(2)
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('keeps an unchanged drag out of the history', () => {
            const rect = makeRect(engine)
            command.execute(makeCtx([rect], 12))

            command.execute(makeCtx([rect], 12, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit).toHaveBeenLastCalledWith(
                'tx-2',
                false,
            )
        })

        it('shares the edit between command instances', () => {
            const rect = makeRect(engine)

            // the slider used to build a new command on every tick
            new ChangeRoundness().execute(makeCtx([rect], 4, true))
            new ChangeRoundness().execute(makeCtx([rect], 8, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledOnce()
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 4, true))
            command.execute(makeCtx([rect], 8))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1', true],
                ['tx-2', true],
            ])
        })
    })
})
