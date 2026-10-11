import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UndoCommand } from '../Undo'
import { MoveCommand } from '../Move'
import {
    createCommandCtx,
    createHistoryEngine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: ReturnType<typeof createHistoryEngine>

const move = (widget: Widget, dx: number, isContinuous = false) =>
    new MoveCommand().execute(
        createCommandCtx(engine, {
            selected: [widget],
            isContinuous,
            params: { dx, dy: 0 },
        }),
    )

describe('UndoCommand', () => {
    const command = new UndoCommand()

    beforeEach(() => {
        vi.useFakeTimers()
        engine = createHistoryEngine()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('cannot run with an empty history', () => {
        expect(command.canExecute(createCommandCtx(engine))).toBe(false)
    })

    it('undoes the last change', () => {
        const rect = makeRect(engine)
        move(rect, 5)
        move(rect, 5)

        command.execute(createCommandCtx(engine))

        expect(rect.left).toBe(5)
    })

    it('undoes an edit that is still open', () => {
        const rect = makeRect(engine)
        move(rect, 5, true)
        const ctx = createCommandCtx(engine)

        expect(command.canExecute(ctx)).toBe(true)
        command.execute(ctx)

        expect(rect.left).toBe(0)
    })
})
