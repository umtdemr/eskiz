import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChangeBorderStyle } from '@/core/command/ChangeBorderStyle'
import { ChangeThickness } from '@/core/command/ChangeThickness'
import { ChangeFontSize } from '@/core/command/ChangeFontSize'
import { ChangeFontStyle } from '@/core/command/ChangeFontStyle'
import { CONTINUOUS_THROTTLE_DELAY } from '@/core/transaction/TransactionHandler'
import { BorderStyle } from '@/helpers/Constant'
import { TextAlign } from '@/core/constants'
import {
    createCommandCtx,
    createHistoryEngine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'
import type { Command } from '@/core/command/Command'
import type { WsWidget } from '@/types/Websocket'

let engine: ReturnType<typeof createHistoryEngine>

const run = <P>(
    command: Command<P>,
    widget: Widget,
    params: P,
    isContinuous = false,
) =>
    command.execute(
        createCommandCtx(engine, { selected: [widget], isContinuous, params }),
    )

describe('HistoryManager', () => {
    const borderStyle = new ChangeBorderStyle()
    const thickness = new ChangeThickness()
    const fontSize = new ChangeFontSize()
    const fontStyle = new ChangeFontStyle()

    beforeEach(() => {
        vi.useFakeTimers()
        engine = createHistoryEngine()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('undo commits the open edit first', () => {
        const rect = makeRect(engine)
        run(borderStyle, rect, { border: BorderStyle.DASHED })
        run(thickness, rect, { thickness: 4 }, true)
        run(thickness, rect, { thickness: 8 }, true)

        engine.historyManager.undo()

        expect(rect.properties.strokeWidth).toBe(2)
        expect(rect.properties.borderStyle).toBe(BorderStyle.DASHED)

        // the late timer must not wipe the redo stack
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)
        engine.historyManager.undo()
        expect(rect.properties.borderStyle).toBe(BorderStyle.SOLID)

        engine.historyManager.redo()
        engine.historyManager.redo()
        expect(rect.properties.borderStyle).toBe(BorderStyle.DASHED)
        expect(rect.properties.strokeWidth).toBe(8)
    })

    it('redo commits the open edit first', () => {
        const rect = makeRect(engine)
        run(borderStyle, rect, { border: BorderStyle.DASHED })
        engine.historyManager.undo()
        run(thickness, rect, { thickness: 8 }, true)

        engine.historyManager.redo()

        // the drag is a new action, so the old redo is gone
        expect(rect.properties.borderStyle).toBe(BorderStyle.SOLID)
        expect(rect.properties.strokeWidth).toBe(8)
        expect(engine.historyManager.canRedo).toBe(false)

        engine.historyManager.undo()
        expect(rect.properties.strokeWidth).toBe(2)
    })

    it('keeps the order when another command cuts in', () => {
        const rect = makeRect(engine, { text: 'hi' })
        run(fontSize, rect, { fontSize: 18 }, true)
        run(fontStyle, rect, { style: 'bold', value: true })

        engine.historyManager.undo()
        expect(rect.hasFontStyle('bold')).toBe(false)
        expect(rect.textProperties.fontSize).toBe(18)

        engine.historyManager.undo()
        expect(rect.textProperties.fontSize).toBe(14)
    })

    it('keeps the redo stack when a drag changed nothing', () => {
        const rect = makeRect(engine)
        run(borderStyle, rect, { border: BorderStyle.DASHED })
        engine.historyManager.undo()

        run(thickness, rect, { thickness: 2 }, true)
        vi.advanceTimersByTime(CONTINUOUS_THROTTLE_DELAY)

        expect(engine.historyManager.canRedo).toBe(true)
        expect(engine.historyManager.canUndo).toBe(false)
    })

    it('undoing a font size keeps text typed afterwards', () => {
        const rect = makeRect(engine, { text: 'hi' })
        run(fontSize, rect, { fontSize: 18 })
        rect.updateText('hi there', [{ text: 'hi there', attributes: {} }])

        engine.historyManager.undo()

        expect(rect.textProperties.fontSize).toBe(14)
        expect(rect.textProperties.text).toBe('hi there')
    })

    it('undoing a font size keeps a remote align change', () => {
        const rect = makeRect(engine, { text: 'hi' })
        run(fontSize, rect, { fontSize: 18 })
        rect.updateWithPartialState({
            properties: { textProperties: { textAlign: TextAlign.LEFT } },
        } as Partial<WsWidget>)

        engine.historyManager.undo()

        expect(rect.textProperties.fontSize).toBe(14)
        expect(rect.textProperties.textAlign).toBe(TextAlign.LEFT)
    })

    it('undoing bold keeps the font size', () => {
        const rect = makeRect(engine, { text: 'hi' })
        run(fontStyle, rect, { style: 'bold', value: true })
        rect.updateWithPartialState({
            properties: { textProperties: { fontSize: 30 } },
        } as Partial<WsWidget>)

        engine.historyManager.undo()

        expect(rect.hasFontStyle('bold')).toBe(false)
        expect(rect.textProperties.fontSize).toBe(30)
    })
})
