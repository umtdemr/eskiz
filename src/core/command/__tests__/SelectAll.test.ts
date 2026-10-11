import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SelectAllCommand } from '../SelectAll'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let toolService: { tool: string; changeTool: ReturnType<typeof vi.fn> }

const setBoard = (children: Widget[]) =>
    Object.assign(engine, {
        stage: { widgetsDefaultLayer: { children } },
    })

describe('SelectAllCommand', () => {
    const command = new SelectAllCommand()

    beforeEach(() => {
        toolService = { tool: 'SELECT', changeTool: vi.fn() }
        engine = createEngineMock({ toolService })
    })

    it('cannot run on an empty board', () => {
        setBoard([])
        expect(command.canExecute(createCommandCtx(engine))).toBe(false)
    })

    it('selects every widget except locked and deleted ones', () => {
        const a = makeRect(engine)
        const b = makeRect(engine)
        const locked = makeRect(engine, { locked: true })
        const deleted = makeRect(engine)
        deleted.isDeleted = true
        setBoard([a, locked, deleted, b])
        const ctx = createCommandCtx(engine)

        command.execute(ctx)

        expect(ctx.selectionService.selected).toEqual([a, b])
        expect(toolService.changeTool).not.toHaveBeenCalled()
    })

    it('switches to the select tool first', () => {
        toolService.tool = 'PATH'
        setBoard([makeRect(engine)])

        command.execute(createCommandCtx(engine))

        expect(toolService.changeTool).toHaveBeenCalledWith('SELECT')
    })
})
