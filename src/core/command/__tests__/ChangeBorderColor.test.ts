import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeBorderColor } from '../ChangeBorderColor'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import { CANVAS_COLORS } from '@/helpers/Constant'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makePen,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { RGBA } from '@/core/shapes/Color'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    color: RGBA = CANVAS_COLORS.RED,
    isContinuous = false,
) =>
    createCommandCtx(engine, {
        selected,
        isContinuous,
        params: { color, widgets: selected },
    })

describe('ChangeBorderColor', () => {
    let command: ChangeBorderColor

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeBorderColor('changeBorderColor')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeRect(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for widgets without a border', () => {
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
        it('changes the stroke color of a shape', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect]))

            expect(rect.properties.strokeColor).toEqual(CANVAS_COLORS.RED)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[rect, ['borderColor']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the color changes', () => {
            const rect = makeRect(engine)
            let colorAtBegin: unknown
            engine.transactionHandler.begin.mockImplementation(() => {
                colorAtBegin = rect.properties.strokeColor
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect]))

            expect(colorAtBegin).toEqual(CANVAS_COLORS.BLACK)
        })

        it('changes the color of a line', () => {
            const line = makeLine(engine)

            command.execute(makeCtx([line]))

            expect(line.strokeColor).toEqual(CANVAS_COLORS.RED)
        })

        it('changes the color of a pen', () => {
            const pen = makePen(engine)

            command.execute(makeCtx([pen]))

            expect(pen.properties.color).toEqual(CANVAS_COLORS.RED)
        })

        it('does nothing without a color', () => {
            const rect = makeRect(engine)

            command.execute(
                createCommandCtx(engine, {
                    selected: [rect],
                    params: { widgets: [rect] },
                }),
            )

            expect(rect.properties.strokeColor).toEqual(CANVAS_COLORS.BLACK)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            const a = makeRect(engine)
            const b = makeRect(engine)

            command.execute(makeCtx([a, b]))

            expect(a.properties.strokeColor).toEqual(CANVAS_COLORS.BLACK)
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

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            expect(rect.properties.strokeColor).toEqual(CANVAS_COLORS.GREEN)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.update).toHaveBeenCalledWith(
                'tx-1',
            )
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2', true],
            ])
        })
    })
})
