import { describe, it, expect } from 'vitest'
import { compareOrder } from '../order'

describe('compareOrder', () => {
    it('sorts by code unit, not locale', () => {
        const keys = ['a1', 'a0l', 'Zz', 'a0V', 'a0']
        expect(keys.sort((a, b) => compareOrder(a, b))).toEqual([
            'Zz',
            'a0',
            'a0V',
            'a0l',
            'a1',
        ])
    })

    it('breaks ties by uuid', () => {
        expect(compareOrder('a0', 'a0', 'b', 'a')).toBe(1)
        expect(compareOrder('a0', 'a0', 'a', 'b')).toBe(-1)
        expect(compareOrder('a0', 'a0', 'a', 'a')).toBe(0)
    })
})
