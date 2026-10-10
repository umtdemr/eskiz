import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ToggleLockCommand } from '../ToggleLock'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let widgets: { toggleLockState: ReturnType<typeof vi.fn> }

const makeCtx = (selected: Widget[]) => createCommandCtx(engine, { selected })

describe('ToggleLockCommand', () => {
    let command: ToggleLockCommand

    beforeEach(() => {
        widgets = {
            toggleLockState: vi.fn((w: Widget) => {
                w.isLocked = !w.isLocked
            }),
        }
        engine = createEngineMock({ widgets })
        command = new ToggleLockCommand('toggleLock')
    })

    it('cannot execute without a selection', () => {
        expect(command.canExecute(makeCtx([]))).toBe(false)
    })

    it('can execute on locked widgets', () => {
        const ctx = makeCtx([makeRect(engine, { locked: true })])
        expect(command.canExecute(ctx)).toBe(true)
    })

    it('toggles every selected widget inside one transaction', () => {
        const a = makeRect(engine)
        const b = makeRect(engine, { locked: true })

        command.execute(makeCtx([a, b]))

        expect(a.isLocked).toBe(true)
        expect(b.isLocked).toBe(false)
        const [type, { editTable }] =
            engine.transactionHandler.begin.mock.calls[0]
        expect(type).toBe('immediate')
        expect([...editTable.entries()]).toEqual([
            [a, ['toggleLock']],
            [b, ['toggleLock']],
        ])
        expect(engine.transactionHandler.commit).toHaveBeenCalledWith('tx-1')
    })

    it('begins the transaction before toggling', () => {
        const rect = makeRect(engine)
        let lockedAtBegin: boolean | undefined
        engine.transactionHandler.begin.mockImplementation(() => {
            lockedAtBegin = rect.isLocked
            return { transactionId: 'tx-1' }
        })

        command.execute(makeCtx([rect]))

        expect(lockedAtBegin).toBe(false)
    })

    it('keeps a single widget selected', () => {
        const rect = makeRect(engine)
        const ctx = makeCtx([rect])

        command.execute(ctx)

        expect(ctx.selectionService.selected).toEqual([rect])
        expect(engine.canvas.requestRender).toHaveBeenCalled()
    })

    it('clears a multi selection', () => {
        const ctx = makeCtx([makeRect(engine), makeRect(engine)])

        command.execute(ctx)

        expect(ctx.selectionService.selected).toEqual([])
    })
})
