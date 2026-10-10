import { describe, it, expect, beforeEach } from 'vitest'
import { ChangeFontStyle } from '../ChangeFontStyle'
import { StickyNote } from '@/core/shapes/stickyNote/StickyNote'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'
import type { FontStyleType } from '@/helpers/Constant'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock

const makeCtx = (selected: Widget[], style?: FontStyleType, value = true) =>
    createCommandCtx(engine, {
        selected,
        params: { style, value, widgets: selected },
    })

describe('ChangeFontStyle', () => {
    let command: ChangeFontStyle

    beforeEach(() => {
        engine = createEngineMock()
        command = new ChangeFontStyle('changeFontStyle')
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
        it('styles a text box', () => {
            const box = makeTextBox(engine)

            command.execute(makeCtx([box], 'bold'))

            expect(box.properties.textOps[0].attributes.bold).toBe(true)
            expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
            const [type, { editTable }] =
                engine.transactionHandler.begin.mock.calls[0]
            expect(type).toBe('immediate')
            expect([...editTable.entries()]).toEqual([[box, ['fontStyle']]])
            expect(engine.transactionHandler.commit).toHaveBeenCalledWith(
                'tx-1',
                true,
            )
        })

        it('begins the transaction before the style changes', () => {
            const box = makeTextBox(engine)
            let boldAtBegin: unknown = 'unset'
            engine.transactionHandler.begin.mockImplementation(() => {
                boldAtBegin = box.properties.textOps[0].attributes.bold
                return { transactionId: 'tx-1' }
            })

            command.execute(makeCtx([box], 'bold'))

            expect(boldAtBegin).toBeUndefined()
        })

        it('turns a style off', () => {
            const box = makeTextBox(engine)
            command.execute(makeCtx([box], 'italic'))

            command.execute(makeCtx([box], 'italic', false))

            expect(box.properties.textOps[0].attributes.italic).toBe(false)
        })

        it('styles a shape', () => {
            const rect = makeRect(engine, { text: 'hi' })

            command.execute(makeCtx([rect], 'underline'))

            expect(rect.textProperties.textOps?.[0].attributes.underline).toBe(
                true,
            )
        })

        it('styles a sticky note', () => {
            const note = new StickyNote(
                {
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 200,
                    properties: {
                        textProperties: {
                            text: 'hi',
                            textOps: [{ text: 'hi', attributes: {} }],
                            fontSize: 14,
                            lineHeight: 1.4,
                            textAlign: 'left',
                        },
                    },
                },
                engine,
            )

            command.execute(makeCtx([note], 'strike'))

            expect(note.textProperties.textOps?.[0].attributes.strike).toBe(
                true,
            )
        })

        it('works with more than one widget selected', () => {
            const a = makeTextBox(engine)
            const b = makeTextBox(engine)

            command.execute(makeCtx([a, b], 'bold'))

            expect(a.properties.textOps[0].attributes.bold).toBe(true)
            expect(b.properties.textOps[0].attributes.bold).toBe(true)
        })

        it('does nothing without a style', () => {
            command.execute(makeCtx([makeTextBox(engine)]))

            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })
    })
})
