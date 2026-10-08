import { describe, it, expect } from 'vitest'
import { getPartialState, EditingMethods } from '../State'
import { TextAlign } from '@/core/constants'
import { createEngineStub } from '@/test/testUtils'
import { makeRect } from '@/test/commandUtils'

const engine = createEngineStub()

const textOf = (state: Record<string, unknown>) =>
    (state.properties as { textProperties: Record<string, unknown> })
        .textProperties

describe('getPartialState', () => {
    it.each<EditingMethods>([
        'textColor',
        'highlightColor',
        'textAlign',
        'fontSize',
        'fontStyle',
    ])('%s keeps a copy of the shape text', (method) => {
        const rect = makeRect(engine, { text: 'hi' })

        const state = getPartialState(rect, [method])
        rect.changeTextAlign(TextAlign.LEFT)
        rect.changeFontSize(30)
        rect.changeTextColor('#ff0000')
        rect.changeFontStyle('bold', true)

        expect(textOf(state)).toMatchObject({
            textAlign: TextAlign.CENTER,
            fontSize: 14,
            textOps: [{ text: 'hi', attributes: {} }],
        })
    })
})
