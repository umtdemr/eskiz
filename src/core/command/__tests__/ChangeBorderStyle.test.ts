import { describe, it, expect, beforeEach } from 'vitest'
import { ChangeBorderStyle } from '../ChangeBorderStyle'
import { BorderStyle } from '@/helpers/Constant'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeLine,
    makePen,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (
    selected: Widget[],
    border: BorderStyle = BorderStyle.DASHED,
) =>
    createCommandCtx(engine, {
        selected,
        params: { border, widgets: selected },
    })

describe('ChangeBorderStyle', () => {
    let command: ChangeBorderStyle

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeBorderStyle('changeBorderStyle')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeRect(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for pens', () => {
            expect(command.canExecute(makeCtx([makePen(engine)]))).toBe(false)
        })

        it('returns true for shapes and lines', () => {
            const ctx = makeCtx([makeRect(engine), makeLine(engine)])
            expect(command.canExecute(ctx)).toBe(true)
        })
    })

    describe('execute', () => {
        it('changes the border style of a shape', () => {
            const rect = makeRect(engine)

            command.execute(makeCtx([rect]))

            expect(rect.properties.borderStyle).toBe(BorderStyle.DASHED)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[rect, ['borderStyle']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the style changes', () => {
            const rect = makeRect(engine)
            let styleAtBegin: unknown
            engine.transactionHandler.begin.mockImplementation(() => {
                styleAtBegin = rect.properties.borderStyle
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([rect]))

            expect(styleAtBegin).toBe(BorderStyle.SOLID)
        })

        it('changes the border style of a line', () => {
            const line = makeLine(engine)

            command.execute(makeCtx([line], BorderStyle.DOTTED))

            expect(line.borderStyle).toBe(BorderStyle.DOTTED)
        })

        it('keeps an unchanged value out of the history', () => {
            command.execute(makeCtx([makeRect(engine)], BorderStyle.SOLID))

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                false,
            )
            expect(engine.canvas.requestRender).not.toHaveBeenCalled()
        })

        it('does nothing without a border style', () => {
            const rect = makeRect(engine)

            command.execute(
                createCommandCtx(engine, {
                    selected: [rect],
                    params: { widgets: [rect] },
                }),
            )

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            const a = makeRect(engine)

            command.execute(makeCtx([a, makeRect(engine)]))

            expect(a.properties.borderStyle).toBe(BorderStyle.SOLID)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
