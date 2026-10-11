import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CloneCommand } from '../Clone'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let duplication: { duplicateWidgets: ReturnType<typeof vi.fn> }

const makeCtx = (list?: Widget[]) =>
    createCommandCtx(engine, {
        selected: list,
        params: list ? { widgets: list } : undefined,
    })

describe('CloneCommand', () => {
    let command: CloneCommand

    beforeEach(() => {
        duplication = { duplicateWidgets: vi.fn(() => []) }
        engine = createEngineMock({ duplication })
        command = new CloneCommand('clone')
    })

    describe('canExecute', () => {
        it('returns false without widgets', () => {
            expect(command.canExecute(makeCtx())).toBe(false)
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a widget is locked', () => {
            const list = [makeRect(engine), makeRect(engine, { locked: true })]
            expect(command.canExecute(makeCtx(list))).toBe(false)
        })

        it('returns true for unlocked widgets', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(true)
        })
    })

    describe('execute', () => {
        it('duplicates the widgets and selects the copies', () => {
            const original = makeRect(engine)
            const copy = makeRect(engine)
            duplication.duplicateWidgets.mockReturnValue([copy])
            const ctx = makeCtx([original])

            command.execute(ctx)

            expect(duplication.duplicateWidgets).toHaveBeenCalledWith([
                original,
            ])
            expect(ctx.selectionService.selected).toEqual([copy])
            expect(original.selected).toBe(false)
            expect(engine.canvas.requestRender).toHaveBeenCalled()
        })

        it('does nothing when a widget is locked', () => {
            command.execute(makeCtx([makeRect(engine, { locked: true })]))

            expect(duplication.duplicateWidgets).not.toHaveBeenCalled()
        })
    })
})
