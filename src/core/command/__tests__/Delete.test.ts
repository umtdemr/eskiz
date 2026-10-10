import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeleteCommand } from '../Delete'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let widgets: { deleteWidget: ReturnType<typeof vi.fn> }

const makeCtx = (list?: Widget[]) =>
    createCommandCtx(engine, {
        selected: list,
        params: list ? { widgets: list } : undefined,
    })

describe('DeleteCommand', () => {
    let command: DeleteCommand

    beforeEach(() => {
        widgets = { deleteWidget: vi.fn() }
        engine = createEngineMock({ widgets })
        command = new DeleteCommand('delete')
    })

    describe('canExecute', () => {
        it('returns false without params', () => {
            expect(command.canExecute(makeCtx())).toBe(false)
        })

        it('returns false for an empty list', () => {
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
        it('deletes every widget inside one transaction', () => {
            const a = makeRect(engine)
            const b = makeRect(engine)

            command.execute(makeCtx([a, b]))

            expect(widgets.deleteWidget.mock.calls).toEqual([[a], [b]])
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([
                [a, ['delete']],
                [b, ['delete']],
            ])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
            )
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
        })

        it('begins the transaction before deleting', () => {
            const rect = makeRect(engine)
            engine.transactionHandler.begin.mockImplementation(() => {
                expect(widgets.deleteWidget).not.toHaveBeenCalled()
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect]))

            expect(widgets.deleteWidget).toHaveBeenCalledOnce()
        })

        it('works on a copy of the list', () => {
            const a = makeRect(engine)
            const b = makeRect(engine)
            const list: Widget[] = [a, b]
            // deleting usually drops the widget from the source list too
            widgets.deleteWidget.mockImplementation((w: Widget) => {
                list.splice(list.indexOf(w), 1)
            })

            command.execute(
                createCommandCtx(engine, { params: { widgets: list } }),
            )

            expect(widgets.deleteWidget).toHaveBeenCalledTimes(2)
        })

        it('does nothing when a widget is locked', () => {
            command.execute(makeCtx([makeRect(engine, { locked: true })]))

            expect(widgets.deleteWidget).not.toHaveBeenCalled()
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
