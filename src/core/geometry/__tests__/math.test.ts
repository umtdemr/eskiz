import { describe, it, expect } from 'vitest'
import { rotatePoint, reverseRotatePoint } from '../math'

describe('rotatePoint', () => {
    it('returns same point for 0 degrees', () => {
        expect(rotatePoint(10, 20, 0, 0, 0)).toEqual({ x: 10, y: 20 })
    })

    it('rotates 90 degrees clockwise around origin', () => {
        const result = rotatePoint(1, 0, 0, 0, 90)
        expect(result.x).toBeCloseTo(0, 10)
        expect(result.y).toBeCloseTo(1, 10)
    })

    it('rotates 180 degrees around origin', () => {
        const result = rotatePoint(1, 0, 0, 0, 180)
        expect(result.x).toBeCloseTo(-1, 10)
        expect(result.y).toBeCloseTo(0, 10)
    })

    it('rotates 270 degrees around origin', () => {
        const result = rotatePoint(1, 0, 0, 0, 270)
        expect(result.x).toBeCloseTo(0, 10)
        expect(result.y).toBeCloseTo(-1, 10)
    })

    it('rotates 360 degrees returns to original position', () => {
        const result = rotatePoint(5, 3, 2, 1, 360)
        expect(result.x).toBeCloseTo(5, 10)
        expect(result.y).toBeCloseTo(3, 10)
    })

    it('rotates around a non-origin center', () => {
        // rotating (10, 5) around center (5, 5) by 90 degrees
        // offset is (5, 0), rotated 90 degrees gives (0, 5)
        // result: (5 + 0, 5 + 5) = (5, 10)
        const result = rotatePoint(10, 5, 5, 5, 90)
        expect(result.x).toBeCloseTo(5, 10)
        expect(result.y).toBeCloseTo(10, 10)
    })

    it('handles negative angles', () => {
        const result = rotatePoint(1, 0, 0, 0, -90)
        expect(result.x).toBeCloseTo(0, 10)
        expect(result.y).toBeCloseTo(-1, 10)
    })

    it('handles 45 degree rotation', () => {
        const result = rotatePoint(1, 0, 0, 0, 45)
        const expected = Math.SQRT2 / 2
        expect(result.x).toBeCloseTo(expected, 10)
        expect(result.y).toBeCloseTo(expected, 10)
    })
})

describe('reverseRotatePoint', () => {
    it('is the inverse of rotatePoint', () => {
        const rotated = rotatePoint(10, 20, 5, 5, 45)
        const reversed = reverseRotatePoint(rotated.x, rotated.y, 5, 5, 45)
        expect(reversed.x).toBeCloseTo(10, 10)
        expect(reversed.y).toBeCloseTo(20, 10)
    })

    it('reverses 90 degree rotation', () => {
        const rotated = rotatePoint(1, 0, 0, 0, 90)
        const reversed = reverseRotatePoint(rotated.x, rotated.y, 0, 0, 90)
        expect(reversed.x).toBeCloseTo(1, 10)
        expect(reversed.y).toBeCloseTo(0, 10)
    })

    it('roundtrips through multiple angles', () => {
        const angles = [30, 60, 120, 150, 210, 300]
        for (const angle of angles) {
            const rotated = rotatePoint(7, 3, 2, 4, angle)
            const reversed = reverseRotatePoint(
                rotated.x,
                rotated.y,
                2,
                4,
                angle,
            )
            expect(reversed.x).toBeCloseTo(7, 10)
            expect(reversed.y).toBeCloseTo(3, 10)
        }
    })
})
