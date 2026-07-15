import { describe, it, expect } from 'vitest'
import { LinkedList } from '../LinkedList'

const listOf = (...values: number[]) => {
    const list = new LinkedList<number>()
    for (const value of values) list.add(value)
    return list
}

describe('LinkedList', () => {
    describe('adding', () => {
        it('adds to the end', () => {
            const list = listOf(1, 2, 3)

            expect(list.toArray()).toEqual([1, 2, 3])
            expect(list.length).toBe(3)
            expect(list.first).toBe(1)
            expect(list.last).toBe(3)
        })

        it('prepends to the front', () => {
            const list = listOf(1, 2)
            list.prepend(0)

            expect(list.toArray()).toEqual([0, 1, 2])
            expect(list.first).toBe(0)
        })

        it('inserts in the middle with addAt', () => {
            const list = listOf(1, 3)
            list.addAt(1, 2)

            expect(list.toArray()).toEqual([1, 2, 3])
        })

        it('appends when addAt index is past the end', () => {
            const list = listOf(1, 2)
            list.addAt(99, 3)

            expect(list.toArray()).toEqual([1, 2, 3])
            expect(list.last).toBe(3)
        })

        it('appends when addAt index is negative', () => {
            const list = listOf(1, 2)
            list.addAt(-1, 3)

            expect(list.toArray()).toEqual([1, 2, 3])
        })
    })

    describe('removing', () => {
        it('removes the first element', () => {
            const list = listOf(1, 2, 3)

            expect(list.removeAt(0)).toEqual([true, 1])
            expect(list.toArray()).toEqual([2, 3])
            expect(list.first).toBe(2)
        })

        it('removes the last element and updates the tail', () => {
            const list = listOf(1, 2, 3)

            expect(list.removeAt(2)).toEqual([true, 3])
            expect(list.last).toBe(2)

            list.add(4)
            expect(list.toArray()).toEqual([1, 2, 4])
        })

        it('removes a middle element', () => {
            const list = listOf(1, 2, 3)

            expect(list.removeAt(1)).toEqual([true, 2])
            expect(list.toArray()).toEqual([1, 3])
        })

        it('reports failure for invalid indices', () => {
            const list = listOf(1)

            expect(list.removeAt(-1)).toEqual([false, null])
            expect(list.removeAt(1)).toEqual([false, null])
            expect(new LinkedList<number>().removeAt(0)).toEqual([false, null])
        })

        it('empties and refills correctly', () => {
            const list = listOf(1)

            list.removeAt(0)
            expect(list.length).toBe(0)
            expect(list.first).toBeUndefined()
            expect(list.last).toBeUndefined()

            list.add(9)
            expect(list.toArray()).toEqual([9])
        })

        it('clear removes everything', () => {
            const list = listOf(1, 2, 3)
            list.clear()

            expect(list.length).toBe(0)
            expect(list.toArray()).toEqual([])
        })
    })

    describe('searching', () => {
        it('finds the index by callback', () => {
            const list = listOf(10, 20, 30)

            expect(list.find((v) => v === 20)).toBe(1)
            expect(list.find((v) => v === 99)).toBe(-1)
        })
    })

    describe('reordering', () => {
        it('moves a value to the front', () => {
            const list = listOf(1, 2, 3)

            expect(list.moveToFront(3)).toBe(true)
            expect(list.toArray()).toEqual([3, 1, 2])
        })

        it('moves a value to the back', () => {
            const list = listOf(1, 2, 3)

            expect(list.moveToBack(1)).toBe(true)
            expect(list.toArray()).toEqual([2, 3, 1])
        })

        it('moves a value one step toward the end', () => {
            const list = listOf(1, 2, 3)

            expect(list.moveTowardEnd(1)).toBe(true)
            expect(list.toArray()).toEqual([2, 1, 3])
        })

        it('moves a value one step toward the start', () => {
            const list = listOf(1, 2, 3)

            expect(list.moveTowardStart(3)).toBe(true)
            expect(list.toArray()).toEqual([1, 3, 2])
        })

        it('reports false when the value is missing or already in place', () => {
            const list = listOf(1, 2, 3)

            expect(list.moveToFront(1)).toBe(false)
            expect(list.moveToBack(3)).toBe(false)
            expect(list.moveTowardEnd(3)).toBe(false)
            expect(list.moveTowardStart(1)).toBe(false)
            expect(list.moveToFront(99)).toBe(false)
        })
    })

    describe('iteration', () => {
        it('iterates forward', () => {
            const list = listOf(1, 2, 3)

            expect([...list]).toEqual([1, 2, 3])
        })

        it('iterates backward', () => {
            const list = listOf(1, 2, 3)

            expect([...list.backward()]).toEqual([3, 2, 1])
        })
    })
})
