import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeFontSize } from '../ChangeFontSize'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (selected: Widget[], fontSize = 24, isContinuous = false) =>
    createCommandCtx(engine, {
        selected,
        isContinuous,
        params: { fontSize, widgets: selected },
    })

describe('ChangeFontSize', () => {
    let command: ChangeFontSize

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeFontSize('changeFontSize')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeTextBox(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for widgets without text', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(false)
            expect(command.canExecute(makeCtx([makeLine(engine)]))).toBe(false)
        })

        it('returns true for text boxes and shapes with text', () => {
            const ctx = makeCtx([
                makeTextBox(engine),
                makeRect(engine, { text: 'hi' }),
            ])
            expect(command.canExecute(ctx)).toBe(true)
        })
    })

    describe('execute (immediate)', () => {
        it('changes the font size of a text box', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box]))

            expect(box.fontSize).toBe(24)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[box, ['fontSize']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the size changes', () => {
            const box = makeTextBox(engine)
            let sizeAtBegin: number | undefined
            engine.transactionHandler.begin.mockImplementation(() => {
                sizeAtBegin = box.fontSize
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([box]))

            expect(sizeAtBegin).toBe(16)
        })

        it('changes the font size of a shape', () => {
            const rect = makeRect(engine, { text: 'hi' })

            command.execute(makeCtx([rect]))

            expect(rect.textProperties.fontSize).toBe(24)
        })

        it('skips the render when the size is unchanged', () => {
            command.execute(makeCtx([makeTextBox(engine)], 16))

            expect(engine.canvas.requestRender).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box, makeTextBox(engine)]))

            expect(box.fontSize).toBe(16)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
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
            const box = makeTextBox(engine)

            command.execute(makeCtx([box], 20, true))
            command.execute(makeCtx([box], 30, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            expect(box.fontSize).toBe(30)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.update).toHaveBeenCalledTimes(2)
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box], 20, true))
            command.execute(makeCtx([box], 30))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2', true],
            ])
        })
    })
})
