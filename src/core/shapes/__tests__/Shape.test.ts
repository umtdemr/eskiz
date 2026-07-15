import { describe, it, expect } from 'vitest'
import { Rectangle } from '../Rectangle'
import { SHAPE_MAX_CHARS } from '../Shape'
import { createEngineStub, renderToPixels, isColor } from '@/test/testUtils'
import { createTextOpsFromString as ops } from '@/test/mockTextEditor'
import { CANVAS_COLORS } from '@/helpers/Constant'
import { TextAlign } from '@/core/constants'

const engine = createEngineStub()

const makeShapeWithText = (text = 'hello') =>
    new Rectangle(
        {
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            properties: {
                fillColor: CANVAS_COLORS.WHITE,
                textProperties: {
                    text,
                    fontSize: 14,
                    lineHeight: 1.4,
                    textAlign: TextAlign.CENTER,
                },
            },
        },
        engine,
    )

const makeShapeWithoutText = () =>
    new Rectangle(
        { x: 0, y: 0, width: 200, height: 100, properties: {} },
        engine,
    )

describe('Shape text', () => {
    describe('without a text object', () => {
        it('reports no text capabilities', () => {
            const shape = makeShapeWithoutText()

            expect(shape.textStr).toBe('')
            expect(shape.canChangeTextColor()).toBe(false)
            expect(shape.canChangeHighlightColor()).toBe(false)
            expect(shape.canChangeTextAlign()).toBe(false)
            expect(shape.canChangeFontSize()).toBe(false)
            expect(shape.canChangeFontStyle()).toBe(false)
        })

        it('text changing methods are no-ops', () => {
            const shape = makeShapeWithoutText()

            expect(shape.changeTextColor('#ff0000')).toBe(false)
            expect(shape.changeFontSize(20)).toBe(false)
            expect(shape.changeTextAlign(TextAlign.LEFT)).toBe(false)
        })

        it('startEditingText creates the text object lazily', () => {
            const shape = makeShapeWithoutText()

            shape.startEditingText()

            expect(shape.canChangeTextColor()).toBe(true)
            expect(shape.textStr).toBe('')
        })
    })

    describe('with a text object', () => {
        it('creates the text from the constructor properties', () => {
            const shape = makeShapeWithText('hello')

            expect(shape.textStr).toBe('hello')
            expect(shape.canChangeTextColor()).toBe(true)
            expect(shape.canChangeFontSize()).toBe(true)
        })

        it('updates text and keeps it in the json properties', () => {
            const shape = makeShapeWithText('hello')

            shape.updateText('updated', ops('updated'))

            expect(shape.textStr).toBe('updated')
            const json = shape.toJson()
            expect(json.properties.textProperties).toMatchObject({
                text: 'updated',
            })
        })

        it('rejects text over the character limit', () => {
            const shape = makeShapeWithText('hello')
            const tooLong = 'x'.repeat(SHAPE_MAX_CHARS + 1)

            shape.updateText(tooLong, ops(tooLong))

            expect(shape.textStr).toBe('hello')
        })

        it('accepts text exactly at the character limit', () => {
            const shape = makeShapeWithText('hello')
            const maxText = 'x'.repeat(SHAPE_MAX_CHARS)

            shape.updateText(maxText, ops(maxText))

            expect(shape.textStr).toBe(maxText)
        })

        it('ignores a trailing newline when checking the limit', () => {
            const shape = makeShapeWithText('hello')
            const maxTextWithNewline = 'x'.repeat(SHAPE_MAX_CHARS) + '\n'

            shape.updateText(maxTextWithNewline, ops(maxTextWithNewline))

            expect(shape.textStr).toBe(maxTextWithNewline)
        })

        it('changeFontSize only reports a change for new values', () => {
            const shape = makeShapeWithText()

            expect(shape.changeFontSize(14)).toBe(false)
            expect(shape.changeFontSize(20)).toBe(true)
            expect(shape.textProperties.fontSize).toBe(20)
        })

        it('changeTextAlign only reports a change for new values', () => {
            const shape = makeShapeWithText()

            expect(shape.changeTextAlign(TextAlign.CENTER)).toBe(false)
            expect(shape.changeTextAlign(TextAlign.LEFT)).toBe(true)
            expect(shape.textProperties.textAlign).toBe(TextAlign.LEFT)
        })

        it('applies and detects font styles', () => {
            const shape = makeShapeWithText()
            // font styles operate on the text ops, which exist once the
            // text has been edited (matching the app flow)
            shape.updateText('hello', ops('hello'))

            expect(shape.hasFontStyle('bold')).toBe(false)
            expect(shape.changeFontStyle('bold', true)).toBe(true)
            expect(shape.hasFontStyle('bold')).toBe(true)

            shape.changeFontStyle('bold', false)
            expect(shape.hasFontStyle('bold')).toBe(false)
        })

        it('stores the text color on the text ops', () => {
            const shape = makeShapeWithText()

            expect(shape.changeTextColor('#ff0000')).toBe(true)

            const textOps = shape.textProperties.textOps!
            expect(textOps.length).toBeGreaterThan(0)
            for (const op of textOps) {
                expect(op.attributes.color).toBe('#ff0000')
            }
        })

        it('draws text pixels inside the shape', () => {
            const withText = makeShapeWithText('MMMMM')
            const withoutText = makeShapeWithoutText()

            const countNonFillPixels = (shape: Rectangle) => {
                const result = renderToPixels(shape, 200, 100)
                let count = 0
                // scan the inner area, skipping the border stroke
                for (let x = 5; x < 195; x += 2) {
                    for (let y = 5; y < 95; y += 2) {
                        const p = result.pixelAt(x, y)
                        if (!isColor(p, CANVAS_COLORS.WHITE) && p.a > 0) count++
                    }
                }
                return count
            }

            expect(countNonFillPixels(withText)).toBeGreaterThan(0)
            // sanity check: an empty white shape has no such pixels
            const emptyResult = renderToPixels(withoutText, 200, 100)
            expect(emptyResult.pixelAt(100, 50).a).toBe(0)
        })
    })
})
