import { describe, it, expect, beforeEach } from 'vitest'
import { ChangeTextAlign } from '../ChangeTextAlign'
import { TextAlign } from '@/core/constants'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { TEXT_ALIGN } from '@/core/shapes/text/TextBox'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (selected: Widget[], textAlign?: TEXT_ALIGN) =>
    createCommandCtx(engine, {
        selected,
        params: { textAlign, widgets: selected },
    })

describe('ChangeTextAlign', () => {
    let command: ChangeTextAlign

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeTextAlign('changeTextAlign')
    })

    describe('canExecute', () => {
        it('returns false when nothing is selected', () => {
            expect(command.canExecute(makeCtx([]))).toBe(false)
        })

        it('returns false when a selected widget is locked', () => {
            const ctx = makeCtx([makeTextBox(engine, { locked: true })])
            expect(command.canExecute(ctx)).toBe(false)
        })

        it('returns false for shapes without text', () => {
            expect(command.canExecute(makeCtx([makeRect(engine)]))).toBe(false)
        })

        it('returns true for text boxes and shapes with text', () => {
            const ctx = makeCtx([
                makeTextBox(engine),
                makeRect(engine, { text: 'hi' }),
            ])
            expect(command.canExecute(ctx)).toBe(true)
        })
    })

    describe('execute', () => {
        it('aligns a text box', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box], TextAlign.RIGHT))

            expect(box.properties.textAlign).toBe(TextAlign.RIGHT)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[box, ['textAlign']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the alignment changes', () => {
            const box = makeTextBox(engine)
            let alignAtBegin: unknown
            engine.transactionHandler.begin.mockImplementation(() => {
                alignAtBegin = box.properties.textAlign
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([box], TextAlign.RIGHT))

            expect(alignAtBegin).toBe(TextAlign.LEFT)
        })

        it('aligns the text of a shape', () => {
            const rect = makeRect(engine, { text: 'hi' })

            command.execute(makeCtx([rect], TextAlign.LEFT))

            expect(rect.textProperties.textAlign).toBe(TextAlign.LEFT)
        })

        it('keeps an unchanged value out of the history', () => {
            command.execute(
                makeCtx([makeRect(engine, { text: 'hi' })], TextAlign.CENTER),
            )

            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                false,
            )
            expect(engine.canvas.requestRender).not.toHaveBeenCalled()
        })

        it('does nothing without an alignment', () => {
            command.execute(makeCtx([makeTextBox(engine)]))

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('does nothing when more than one widget is selected', () => {
            const box = makeTextBox(engine)

            command.execute(
                makeCtx([box, makeTextBox(engine)], TextAlign.RIGHT),
            )

            expect(box.properties.textAlign).toBe(TextAlign.LEFT)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
