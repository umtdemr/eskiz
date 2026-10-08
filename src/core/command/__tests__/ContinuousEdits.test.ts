import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContinuousEdits } from '../ContinuousEdits'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import { createEngineMock, EngineMock, makeRect } from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'
import type { EditingMethods } from '@/core/transaction/State'

let engine: EngineMock
let edits: ContinuousEdits

const table = (...widgets: Widget[]) =>
    new Map<Widget, EditingMethods[]>(
        widgets.map((w) => [w, ['backgroundColor']]),
    )

describe('ContinuousEdits', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        engine = createEngineMock()
        edits = new ContinuousEdits(engine)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('begins before the change and updates after it', () => {
        const calls: string[] = []
        engine.transactionHandler.begin.mockImplementation(() => {
            calls.push('begin')
            return { transactionId: 'tx-1' }
        })
        engine.transactionHandler.update.mockImplementation(() => {
            calls.push('update')
        })

        edits.apply('changeBgColor', table(makeRect(engine)), () => {
            calls.push('change')
            return true
        })

        expect(calls).toEqual(['begin', 'change', 'update'])
        expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
    })

    it('skips the render when nothing changed', () => {
        edits.apply('changeBgColor', table(makeRect(engine)), () => false)

        expect(engine.canvas.requestRender).not.toHaveBeenCalled()
    })

    it('reuses the edit for the same widgets', () => {
        const a = makeRect(engine)
        const b = makeRect(engine)

        edits.apply('changeBgColor', table(a, b), () => true)
        edits.apply('changeBgColor', table(b, a), () => true)

        expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
    })

    it('commits once the changes settle', () => {
        const rect = makeRect(engine)

        edits.apply('changeBgColor', table(rect), () => true)
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)
        edits.apply('changeBgColor', table(rect), () => true)
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

        expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)

        expect(engine.transactionHandler.commit.mock.calls).toEqual([['tx-1']])
    })

    it('runs edits on separate widgets side by side', () => {
        edits.apply('changeBgColor', table(makeRect(engine)), () => true)
        edits.apply('changeBgColor', table(makeRect(engine)), () => true)

        expect(engine.transactionHandler.begin).toHaveBeenCalledTimes(2)
        expect(engine.transactionHandler.commit).not.toHaveBeenCalled()
    })

    it('commits an overlapping edit before starting a new one', () => {
        const a = makeRect(engine)
        const b = makeRect(engine)
        const c = makeRect(engine)

        edits.apply('changeBgColor', table(a, b), () => true)
        edits.apply('changeBgColor', table(b, c), () => true)

        expect(engine.transactionHandler.commit.mock.calls).toEqual([['tx-1']])

        // the old timer is gone
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)
        expect(engine.transactionHandler.commit.mock.calls).toEqual([
            ['tx-1'],
            ['tx-2'],
        ])
    })

    it('keeps edits of different commands apart', () => {
        const rect = makeRect(engine)

        edits.apply('changeBgColor', table(rect), () => true)
        edits.apply('changeBorderColor', table(rect), () => true)

        expect(engine.transactionHandler.begin).toHaveBeenCalledTimes(2)
        expect(engine.transactionHandler.commit).not.toHaveBeenCalled()
    })

    it('end commits only the edits touching the widgets', () => {
        const a = makeRect(engine)
        const b = makeRect(engine)
        edits.apply('changeBgColor', table(a), () => true)
        edits.apply('changeBgColor', table(b), () => true)

        edits.end('changeBgColor', [b])

        expect(engine.transactionHandler.commit.mock.calls).toEqual([['tx-2']])

        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)
        expect(engine.transactionHandler.commit.mock.calls).toEqual([
            ['tx-2'],
            ['tx-1'],
        ])
    })
})
