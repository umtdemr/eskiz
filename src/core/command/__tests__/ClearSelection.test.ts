import { describe, it, expect, beforeEach } from 'vitest'
import { ClearSelectionCommand } from '../ClearSelection'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'

let engine: EngineMock

describe('ClearSelectionCommand', () => {
    const command = new ClearSelectionCommand()

    beforeEach(() => {
        engine = createEngineMock()
    })

    it('cannot run without a selection', () => {
        expect(command.canExecute(createCommandCtx(engine))).toBe(false)
    })

    it('clears the selection', () => {
        const rect = makeRect(engine)
        const ctx = createCommandCtx(engine, { selected: [rect] })

        command.execute(ctx)

        expect(ctx.selectionService.selected).toEqual([])
        expect(rect.selected).toBe(false)
        expect(engine.canvas.requestRender).toHaveBeenCalled()
    })
})
