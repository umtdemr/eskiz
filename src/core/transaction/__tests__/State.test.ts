import { describe, it, expect } from 'vitest'
import { getPartialState, EditingMethods } from '../State'
import { TextAlign } from '@/core/constants'
import { createEngineStub } from '@/test/testUtils'
import { makeRect, makeTextBox } from '@/test/commandUtils'

const engine = createEngineStub()

const textOf = (state: Record<string, unknown>) =>
    (state.properties as { textProperties: Record<string, unknown> })
        .textProperties

describe('getPartialState', () => {
    it.each<[EditingMethods, Record<string, unknown>]>([
        ['fontSize', { fontSize: 14 }],
        ['textAlign', { textAlign: TextAlign.CENTER }],
        [
            'textColor',
            { text: 'hi', textOps: [{ text: 'hi', attributes: {} }] },
        ],
        [
            'highlightColor',
            { text: 'hi', textOps: [{ text: 'hi', attributes: {} }] },
        ],
        [
            'fontStyle',
            { text: 'hi', textOps: [{ text: 'hi', attributes: {} }] },
        ],
    ])('%s keeps only what it changes', (method, expected) => {
        const rect = makeRect(engine, { text: 'hi' })

        const state = getPartialState(rect, [method])
        rect.changeTextAlign(TextAlign.LEFT)
        rect.changeFontSize(30)
        rect.changeTextColor('#ff0000')
        rect.changeFontStyle('bold', true)

        expect(textOf(state)).toEqual(expected)
    })

    it('merges text fields of several methods', () => {
        const rect = makeRect(engine, { text: 'hi' })

        const state = getPartialState(rect, ['fontSize', 'textAlign'])

        expect(textOf(state)).toEqual({
            fontSize: 14,
            textAlign: TextAlign.CENTER,
        })
    })

    it('keeps text box styles to text and ops', () => {
        const box = makeTextBox(engine)

        const state = getPartialState(box, ['textColor'])

        expect(Object.keys(state.properties as object)).toEqual([
            'text',
            'textOps',
        ])
    })
})
