import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeHighlightColor } from '../ChangeHighlightColor'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (selected: Widget[], rgba = '#ff0000', isContinuous = false) =>
    createCommandCtx(engine, {
        selected,
        isContinuous,
        params: { rgba, widgets: selected },
    })

describe('ChangeHighlightColor', () => {
    let command: ChangeHighlightColor

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeHighlightColor('changeHighlightColor')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeTextBox(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for shapes without text', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(false)
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
        it('highlights every op of a text box', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box]))

            expect(box.properties.textOps[0].attributes.background).toBe(
                '#ff0000',
            )
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([
                [box, ['highlightColor']],
            ])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the color changes', () => {
            const box = makeTextBox(engine)
            let colorAtBegin: unknown = 'unset'
            engine.transactionHandler.begin.mockImplementation(() => {
                colorAtBegin = box.properties.textOps[0].attributes.background
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([box]))

            expect(colorAtBegin).toBeUndefined()
        })

        it('highlights the text of a shape', () => {
            const rect = makeRect(engine, { text: 'hi' })

            command.execute(makeCtx([rect]))

            expect(rect.textProperties.textOps?.[0].attributes.background).toBe(
                '#ff0000',
            )
        })

        it('does nothing without a color', () => {
            command.execute(makeCtx([makeTextBox(engine)], ''))

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            command.execute(makeCtx([makeTextBox(engine), makeTextBox(engine)]))

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

            command.execute(makeCtx([box], '#ff0000', true))
            command.execute(makeCtx([box], '#00ff00', true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            expect(box.properties.textOps[0].attributes.background).toBe(
                '#00ff00',
            )
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.update).toHaveBeenCalledWith(
                'tx-1',
            )
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box], '#ff0000', true))
            command.execute(makeCtx([box], '#00ff00'))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2', true],
            ])
        })
    })
})
