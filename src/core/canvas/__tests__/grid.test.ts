import { describe, it, expect } from 'vitest'
import { gridLevels, snap, snapPoint } from '../grid'

describe('gridLevels', () => {
    it('fades in 10 under a full 50 at 100%', () => {
        const [fine, coarse] = gridLevels(1)
        expect(fine.size).toBe(10)
        expect(fine.alpha).toBeGreaterThan(0)
        expect(fine.alpha).toBeLessThan(0.2)
        expect(coarse).toEqual({ size: 50, alpha: 1 })
    })

    it('never goes finer than the snap step', () => {
        const [fine] = gridLevels(4)
        expect(fine).toEqual({ size: 10, alpha: 1 })
    })

    it('keeps the finer level at least 8px apart when zoomed out', () => {
        for (const zoom of [0.01, 0.05, 0.13, 0.5, 0.8]) {
            const [fine, coarse] = gridLevels(zoom)
            expect(fine.size * zoom).toBeGreaterThanOrEqual(8 - 1e-9)
            expect(fine.size * zoom).toBeLessThan(40 + 1e-9)
            expect(coarse.size).toBe(fine.size * 5)
        }
    })

    it('hands over smoothly between levels', () => {
        // just under 0.8 the fine level is 50 and almost full,
        // just over it the fine level is 10 and fully faded
        const below = gridLevels(0.8 - 1e-6)
        const above = gridLevels(0.8 + 1e-6)
        expect(below[0].size).toBe(50)
        expect(below[0].alpha).toBeCloseTo(1, 4)
        expect(above[0].size).toBe(10)
        expect(above[0].alpha).toBeCloseTo(0, 4)
        expect(above[1].size).toBe(50)
    })
})

describe('snap', () => {
    it('rounds to the nearest 10', () => {
        expect(snap(14)).toBe(10)
        expect(snap(15)).toBe(20)
        expect(snap(-14)).toBe(-10)
        expect(snapPoint({ x: 3, y: 27 })).toEqual({ x: 0, y: 30 })
    })
})
