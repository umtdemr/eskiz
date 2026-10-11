import { describe, it, expect, beforeEach } from 'vitest'
import { ChangeLineArrow } from '../ChangeLineArrow'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    hasHeadArrow = true,
    hasTailArrow = false,
) =>
    createCommandCtx(engine, {
        selected,
        params: { hasHeadArrow, hasTailArrow, widgets: selected },
    })

describe('ChangeLineArrow', () => {
    let command: ChangeLineArrow

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeLineArrow('changeLineArrow')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected line is locked', () => {
            const ctx = makeCtx([makeLine(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false when a non line is selected', () => {
            const ctx = makeCtx([makeLine(engine), makeRect(engine)])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns true for lines', () => {
            const ctx = makeCtx([makeLine(engine), makeLine(engine)])
            expect(command.canExecute(ctx)).toBe(true)
        })
    })

    describe('execute', () => {
        it('changes the arrows of every line', () => {
            const a = makeLine(engine)
            const b = makeLine(engine)

            command.execute(makeCtx([a, b], true, true))

            expect(a.hasHeadArrow).toBe(true)
            expect(a.hasTailArrow).toBe(true)
            expect(b.hasHeadArrow).toBe(true)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([
                [a, ['arrowPosition']],
                [b, ['arrowPosition']],
            ])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the arrows change', () => {
            const line = makeLine(engine)
            let headAtBegin: boolean | undefined
            engine.transactionHandler.begin.mockImplementation(() => {
                headAtBegin = line.hasHeadArrow
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([line]))

            expect(headAtBegin).toBe(false)
        })

        it('removes arrows', () => {
            const line = makeLine(engine)
            command.execute(makeCtx([line], true, true))

            command.execute(makeCtx([line], false, false))

            expect(line.hasHeadArrow).toBe(false)
            expect(line.hasTailArrow).toBe(false)
        })

        it('skips the render when nothing changed', () => {
            command.execute(makeCtx([makeLine(engine)], false, false))

            expect(engine.canvas.requestRender).not.toHaveBeenCalled()
        })

        it('does nothing for an empty widget list', () => {
            command.execute(
                createCommandCtx(engine, {
                    selected: [makeLine(engine)],
                    params: { hasHeadArrow: true, widgets: [] },
                }),
            )

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
