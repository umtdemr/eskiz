import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChangeBgColor } from '../ChangeBgColor'
import { Rectangle } from '@/core/shapes/Rectangle'
import { StickyNote } from '@/core/shapes/stickyNote/StickyNote'
import { Widget } from '@/core/shapes/Widget'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import { CANVAS_COLORS } from '@/helpers/Constant'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
} from '@/test/commandUtils'
import type { RGBA } from '@/core/shapes/Color'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    color: RGBA = CANVAS_COLORS.RED,
    isContinuous = false,
) => createCommandCtx(engine, { selected, isContinuous, params: { color } })

const makeRect = (isLocked = false) =>
    new Rectangle(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            is_locked: isLocked,
            properties: {},
        },
        engine,
    )

describe('ChangeBgColor', () => {
    let command: ChangeBgColor

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeBgColor('changeBgColor')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            expect(command.canExecute(makeCtx([makeRect(true)]))).toBe(false)
        })

        it('returns false when a selected widget cannot change bg color', () => {
            const widget = {
                isLocked: false,
                canChangeBgColor: () => false,
            } as unknown as Widget

            expect(command.canExecute(makeCtx([makeRect(), widget]))).toBe(
                false,
            )
        })

        it('returns true for unlocked widgets that support bg color', () => {
            expect(command.canExecute(makeCtx([makeRect()]))).toBe(true)
            expect(command.canExecute(makeCtx([makeRect(), makeRect()]))).toBe(
                true,
            )
        })
    })

    describe('execute (immediate)', () => {
        it('changes the fill color inside a single committed transaction', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect], CANVAS_COLORS.RED))

            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.RED)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
            expect(engine.transactionHandler.update).not.toHaveBeenCalled()
        })

        it('begins the transaction before the color changes', () => {
            const rect = makeRect()
            let colorAtBegin: RGBA | undefined
            engine.transactionHandler.begin.mockImplementation(() => {
                colorAtBegin = rect.properties.fillColor as RGBA
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect], CANVAS_COLORS.RED))

            // the initial state must be captured with the old color so undo works
            expect(colorAtBegin).toEqual(CANVAS_COLORS.TRANSPARENT)
        })

        it('tracks the background color of the widget in the edit table', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect]))

            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([
                [rect, ['backgroundColor']],
            ])
        })

        it('works for sticky notes', () => {
            const note = new StickyNote(
                { x: 0, y: 0, width: 200, height: 200, properties: {} },
                engine,
            )

            command.execute(makeCtx([note], CANVAS_COLORS.BLACK))

            expect(note.properties.fillColor).toEqual(CANVAS_COLORS.BLACK)
            expect(engine.transactionHandler.commit).toHaveBeenCalledOnce()
        })

        it('does nothing when more than one widget is selected', () => {
            const a = makeRect()
            const b = makeRect()

            command.execute(makeCtx([a, b]))

            expect(a.properties.fillColor).toEqual(CANVAS_COLORS.TRANSPARENT)
            expect(b.properties.fillColor).toEqual(CANVAS_COLORS.TRANSPARENT)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when the widget is locked', () => {
            const rect = makeRect(true)

            command.execute(makeCtx([rect]))

            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.TRANSPARENT)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('ignores widgets that are not a shape, text box or sticky note', () => {
            const widget = {
                isLocked: false,
                canChangeBgColor: () => true,
                changeBgColor: vi.fn(),
            }

            command.execute(makeCtx([widget as unknown as Widget]))

            expect(widget.changeBgColor).not.toHaveBeenCalled()
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

        it('reuses one transaction for consecutive changes', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN, true))
            command.execute(makeCtx([rect], CANVAS_COLORS.BLACK, true))

            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.BLACK)
            expect(engine.transactionHandler.begin).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'continuous',
                expect.anything(),
            )
            expect(engine.transactionHandler.update).toHaveBeenCalledTimes(3)
            expect(engine.transactionHandler.update).toHaveBeenCalledWith(
                'tx-1',
            )
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()
        })

        it('commits once the changes settle', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY - 1)

            // every change restarts the timer
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)

            expect(engine.transactionHandler.commit).toHaveBeenCalledOnce()
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
        })

        it('starts a new transaction after the previous one is committed', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN, true))
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

            expect(engine.transactionHandler.begin).toHaveBeenCalledTimes(2)
            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2'],
            ])
        })

        it('an immediate change commits the pending continuous transaction first', () => {
            const rect = makeRect()

            command.execute(makeCtx([rect], CANVAS_COLORS.RED, true))
            command.execute(makeCtx([rect], CANVAS_COLORS.GREEN, false))

            expect(engine.transactionHandler.commit.mock.calls).toEqual([
                ['tx-1'],
                ['tx-2'],
            ])
            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.GREEN)

            // the pending timer must not commit tx-1 a second time
            vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)
            expect(engine.transactionHandler.commit).toHaveBeenCalledTimes(2)
        })
    })
})
