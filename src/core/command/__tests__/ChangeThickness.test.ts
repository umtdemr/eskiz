import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeThickness } from '../ChangeThickness'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import { DEFAULT_SHAPE_THICKNESS } from '@/helpers/Constant'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makePen,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    thickness: number | undefined = 8,
    isContinuous = false,
) =>
    createCommandCtx(engine, {
        selected,
        isContinuous,
        params: { thickness, widgets: selected },
    })

describe('ChangeThickness', () => {
    let command: ChangeThickness

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeThickness('changeThickness')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeRect(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for text boxes', () => {
            expect(command.canExecute(makeCtx([makeTextBox(engine)]))).toBe(
                false,
            )
        })

        it('returns true for shapes, lines and pens', () => {
            const ctx = makeCtx([
                makeRect(engine),
                makeLine(engine),
                makePen(engine),
            ])
            expect(command.canExecute(ctx)).toBe(true)
        })
    })

    describe('execute (immediate)', () => {
        it('changes the stroke width of a shape', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect]))

            expect(rect.properties.strokeWidth).toBe(8)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[rect, ['thickness']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('begins the transaction before the width changes', () => {
            const rect = makeRect(engine)
            let widthAtBegin: unknown
            engine.transactionHandler.begin.mockImplementation(() => {
                widthAtBegin = rect.properties.strokeWidth
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect]))

            expect(widthAtBegin).toBe(DEFAULT_SHAPE_THICKNESS)
        })

        it('changes the width of a line', () => {
            const line = makeLine(engine)

            command.execute(makeCtx([line]))

            expect(line.strokeWidth).toBe(8)
        })

        it('also tracks resize for pens', () => {
            const pen = makePen(engine)

            command.execute(makeCtx([pen]))

            expect(pen.properties.strokeWidth).toBe(8)
            const [, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(editTable.get(pen)).toEqual(['resize', 'thickness'])
        })

        it('does nothing for a zero thickness', () => {
            command.execute(makeCtx([makeRect(engine)], 0))

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            const a = makeRect(engine)

            command.execute(makeCtx([a, makeRect(engine)]))

            expect(a.properties.strokeWidth).toBe(DEFAULT_SHAPE_THICKNESS)
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
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 4, true))
            command.execute(makeCtx([rect], 6, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            expect(rect.properties.strokeWidth).toBe(6)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.update).toHaveBeenCalledTimes(2)
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], 4, true))
            command.execute(makeCtx([rect], 6))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2'],
            ])
        })
    })
})
