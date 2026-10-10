import { describe, it, expect } from 'vitest'
import { isDarkColor } from '../Color'

describe('isDarkColor', () => {
    it('black is dark', () => {
        expect(isDarkColor({ r: 0, g: 0, b: 0, a: 1 })).toBe(true)
    })

    it('white is not dark', () => {
        expect(isDarkColor({ r: 255, g: 255, b: 255, a: 1 })).toBe(false)
    })

    it('dark red is dark', () => {
        expect(isDarkColor({ r: 50, g: 0, b: 0, a: 1 })).toBe(true)
    })

    it('bright yellow is not dark', () => {
        expect(isDarkColor({ r: 255, g: 255, b: 0, a: 1 })).toBe(false)
    })

    it('mid-gray near threshold', () => {
        expect(isDarkColor({ r: 90, g: 90, b: 90, a: 1 })).toBe(true)
    })

    it('slightly lighter gray is not dark', () => {
        expect(isDarkColor({ r: 110, g: 110, b: 110, a: 1 })).toBe(false)
    })
})
