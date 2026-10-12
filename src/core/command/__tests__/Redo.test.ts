import { describe, it, expect, beforeEach } from 'vitest'
import { RedoCommand } from '../Redo'
import { MoveCommand } from '../Move'
import {
    createCommandCtx,
    createHistoryEngine,
    makeRect,
} from '@/test/commandUtils'

let engine: ReturnType<typeof createHistoryEngine>

describe('RedoCommand', () => {
    const command = new RedoCommand()

    beforeEach(() => {
        engine = createHistoryEngine()
    })

    it('cannot run when nothing was undone', () => {
        expect(command.canExecute(createCommandCtx(engine))).toBe(false)
    })

    it('redoes the undone change', () => {
        const rect = makeRect(engine)
        new MoveCommand().execute(
            createCommandCtx(engine, {
                selected: [rect],
                params: { dx: 5, dy: 0 },
            }),
        )
        engine.historyManager.undo()

        command.execute(createCommandCtx(engine))

        expect(rect.left).toBe(5)
    })
})
