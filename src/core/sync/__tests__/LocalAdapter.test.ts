import { describe, it, expect } from 'vitest'
import { mergeWidgetData } from '../LocalAdapter'

const widget = {
    uuid: 'a',
    x: 0,
    properties: {
        fillColor: 'red',
        textProperties: {
            text: 'hi',
            textOps: [{ text: 'hi', attributes: {} }],
            fontSize: 14,
            textAlign: 'center',
        },
    },
}

describe('mergeWidgetData', () => {
    it('keeps shape text fields missing from the update', () => {
        const updated = mergeWidgetData(widget, {
            properties: { textProperties: { fontSize: 18 } },
        })

        expect(updated.properties).toEqual({
            fillColor: 'red',
            textProperties: {
                text: 'hi',
                textOps: [{ text: 'hi', attributes: {} }],
                fontSize: 18,
                textAlign: 'center',
            },
        })
    })

    it('replaces the ops but keeps the size', () => {
        const ops = [{ text: 'hi', attributes: { bold: true } }]

        const updated = mergeWidgetData(widget, {
            properties: { textProperties: { text: 'hi', textOps: ops } },
        })

        expect(updated.properties).toMatchObject({
            textProperties: { textOps: ops, fontSize: 14 },
        })
    })

    it('adds text to a widget without any', () => {
        const updated = mergeWidgetData(
            { uuid: 'a', properties: {} },
            { properties: { textProperties: { text: 'hi' } } },
        )

        expect(updated.properties).toEqual({ textProperties: { text: 'hi' } })
    })

    it('sets top-level fields and other properties', () => {
        const updated = mergeWidgetData(widget, {
            x: 10,
            properties: { fillColor: 'blue' },
        })

        expect(updated.x).toBe(10)
        expect(updated.properties).toMatchObject({
            fillColor: 'blue',
            textProperties: { text: 'hi' },
        })
    })

    it('leaves the stored widget alone', () => {
        mergeWidgetData(widget, {
            properties: { textProperties: { fontSize: 18 } },
        })

        expect(widget.properties.textProperties.fontSize).toBe(14)
    })
})
