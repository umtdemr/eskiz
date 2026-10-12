import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CopyCommand } from '../Copy'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let clipboard: { copy: ReturnType<typeof vi.fn> }

const makeCtx = (list?: Widget[]) =>
    createCommandCtx(engine, { selected: list })

describe('CopyCommand', () => {
    let command: CopyCommand

    beforeEach(() => {
        clipboard = { copy: vi.fn() }
        engine = createEngineMock({ clipboard })
        command = new CopyCommand()
    })

    it('needs unlocked widgets', () => {
        expect(command.canExecute(makeCtx())).toBe(false)
        expect(
            command.canExecute(makeCtx([makeRect(engine, { locked: true })])),
        ).toBe(false)
        expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(true)
    })

    it('copies the widgets', () => {
        const rect = makeRect(engine)

        command.execute(makeCtx([rect]))

        expect(clipboard.copy).toHaveBeenCalledWith([rect])
    })

    it('does nothing when a widget is locked', () => {
        command.execute(makeCtx([makeRect(engine, { locked: true })]))
        expect(clipboard.copy).not.toHaveBeenCalled()
    })
})
