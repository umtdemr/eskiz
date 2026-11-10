import { describe, it, expect } from 'vitest'
import { Line } from '../Line'
import { createEngineStub } from '@/test/testUtils'

const flat = (props: { hasHeadArrow?: boolean } = {}) =>
    new Line(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 0,
            properties: {
                points: [
                    [0, 0],
                    [100, 0],
                ],
                strokeWidth: 4,
                ...props,
            },
        },
        createEngineStub(),
    )

describe('Line render bounds', () => {
    it('covers the stroke of a flat line', () => {
        const b = flat().renderBounds

        expect([b.x, b.y, b.width, b.height]).toEqual([-2, -2, 104, 4])
    })

    it('covers the arrow head', () => {
        const b = flat({ hasHeadArrow: true }).renderBounds

        // arrow is 2.5 * stroke wide on each side, plus half the stroke
        expect([b.top, b.bottom, b.right]).toEqual([-12, 12, 102])
    })
})
