import { describe, it, expect } from 'vitest'
import { createEngineStub } from '@/test/testUtils'
import { makePen } from '@/test/commandUtils'

// diagonal stroke from (0, 0) to (100, 100)
const pen = () => makePen(createEngineStub())

describe('Pen hit testing', () => {
    it('hits on the stroke', () => {
        expect(pen().contains(50, 50, 1)).toBe(true)
    })

    it('hits a few pixels off the stroke', () => {
        expect(pen().contains(54, 50, 1)).toBe(true)
    })

    it('misses the empty part of the box', () => {
        expect(pen().contains(90, 10, 1)).toBe(false)
        expect(pen().contains(30, 70, 1)).toBe(false)
    })

    it('follows resize', () => {
        const p = pen()
        p.updateWithPartialState({ width: 200, height: 200 })

        expect(p.contains(150, 150, 1)).toBe(true)
        expect(p.contains(150, 50, 1)).toBe(false)
    })
})
