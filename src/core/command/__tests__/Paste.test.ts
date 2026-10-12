import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PasteCommand } from '../Paste'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { WidgetJson } from '@/core/shapes/Widget'

let engine: EngineMock
let duplication: { addCopies: ReturnType<typeof vi.fn> }

const json = (x: number, y: number, width = 100, height = 50) =>
    ({ x, y, width, height }) as WidgetJson

const makeCtx = (widgets: WidgetJson[], at = { x: 0, y: 0 }) =>
    createCommandCtx(engine, { params: { widgets, at } })

describe('PasteCommand', () => {
    let command: PasteCommand

    beforeEach(() => {
        duplication = { addCopies: vi.fn(() => []) }
        engine = createEngineMock({ duplication })
        command = new PasteCommand()
    })

    it('needs widgets to paste', () => {
        expect(command.canExecute(makeCtx([]))).toBe(false)
        expect(command.canExecute(makeCtx([json(0, 0)]))).toBe(true)
    })

    it('centers the widgets on the given point', () => {
        const widgets = [json(0, 0), json(200, 100)]

        command.execute(makeCtx(widgets, { x: 1000, y: 500 }))

        // bounds are 0,0 to 300,150
        expect(duplication.addCopies).toHaveBeenCalledWith(widgets, 850, 425)
    })

    it('selects the pasted widgets', () => {
        const copy = makeRect(engine)
        duplication.addCopies.mockReturnValue([copy])
        const ctx = makeCtx([json(0, 0)])

        command.execute(ctx)

        expect(ctx.selectionService.selected).toEqual([copy])
        expect(engine.canvas.requestRender).toHaveBeenCalled()
    })

    it('does nothing without widgets', () => {
        command.execute(makeCtx([]))
        expect(duplication.addCopies).not.toHaveBeenCalled()
    })
})
