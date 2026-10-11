import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeThickness } from '@/core/command/ChangeThickness'
import { ChangeFontSize } from '@/core/command/ChangeFontSize'
import { CONTINUOUS_THROTTLE_DELAY } from '../TransactionHandler'
import {
    createCommandCtx,
    createHistoryEngine,
    makePen,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'
import type { EditingMethods } from '../State'

let engine: ReturnType<typeof createHistoryEngine>

const thicken = (widget: Widget, thickness: number) =>
    new ChangeThickness().execute(
        createCommandCtx(engine, {
            selected: [widget],
            isContinuous: true,
            params: { thickness },
        }),
    )

// what DragHandler does
const drag = (widget: Widget, x: number) => {
    const { transactionHandler } = engine
    const { transactionId } = transactionHandler.begin('continuous', {
        editTable: new Map<Widget, EditingMethods[]>([[widget, ['move']]]),
    })
    widget.move(x, widget.top)
    transactionHandler.commit(transactionId)
}

describe('TransactionHandler', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        engine = createHistoryEngine()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('begin commits open edits on the same widgets', () => {
        const pen = makePen(engine)
        const start = pen.left
        thicken(pen, 10)
        // a wider stroke grows the bounds
        const thick = pen.left
        drag(pen, 50)

        engine.historyManager.undo()
        expect(pen.left).toBe(thick)
        expect(pen.properties.strokeWidth).toBe(10)

        engine.historyManager.undo()
        expect(pen.left).toBe(start)
        expect(pen.properties.strokeWidth).toBe(2)

        engine.historyManager.redo()
        engine.historyManager.redo()
        expect(pen.left).toBe(50)
        expect(pen.properties.strokeWidth).toBe(10)
    })

    it('begin leaves edits on other widgets open', () => {
        const a = makePen(engine)
        const b = makePen(engine)
        thicken(a, 10)
        drag(b, 50)
        thicken(a, 12)
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

        // one entry for the whole drag on a
        engine.historyManager.undo()
        expect(a.properties.strokeWidth).toBe(2)
        expect(b.left).toBe(50)
    })

    it('syncs only the font size', () => {
        const rect = makeRect(engine, { text: 'hi' })
        new ChangeFontSize().execute(
            createCommandCtx(engine, {
                selected: [rect],
                params: { fontSize: 18 },
            }),
        )

        const [data] = engine.syncAdapter.syncTransaction.mock.calls[0]
        expect(data.shapes[0].data).toEqual({
            properties: { textProperties: { fontSize: 18 } },
        })
    })
})
