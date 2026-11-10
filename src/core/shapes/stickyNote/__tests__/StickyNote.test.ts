import { describe, it, expect } from 'vitest'
import { StickyNote, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../StickyNote'
import { createEngineStub } from '@/test/testUtils'

const note = (width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) =>
    new StickyNote(
        { x: 0, y: 0, width, height, properties: {} },
        createEngineStub(),
    )

describe('StickyNote render bounds', () => {
    it('covers the shadow below', () => {
        const b = note().renderBounds

        expect([b.left, b.top, b.right, b.bottom]).toEqual([
            -3,
            -1,
            DEFAULT_WIDTH + 3,
            DEFAULT_HEIGHT + 5,
        ])
    })

    it('grows the shadow with the note', () => {
        const b = note(DEFAULT_WIDTH * 2, DEFAULT_HEIGHT * 2).renderBounds

        expect(b.bottom).toBe(DEFAULT_HEIGHT * 2 + 10)
    })
})
