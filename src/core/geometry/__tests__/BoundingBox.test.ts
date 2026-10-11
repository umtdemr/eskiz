import { describe, it, expect } from 'vitest'
import { BoundingBox } from '../BoundingBox'

describe('BoundingBox', () => {
    describe('constructor', () => {
        it('creates with default values', () => {
            const bb = new BoundingBox()
            expect(bb.x).toBe(0)
            expect(bb.y).toBe(0)
            expect(bb.width).toBe(0)
            expect(bb.height).toBe(0)
        })

        it('creates with specified values', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            expect(bb.x).toBe(10)
            expect(bb.y).toBe(20)
            expect(bb.width).toBe(100)
            expect(bb.height).toBe(50)
        })
    })

    describe('derived properties', () => {
        it('calculates left/top/right/bottom', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            expect(bb.left).toBe(10)
            expect(bb.top).toBe(20)
            expect(bb.right).toBe(110)
            expect(bb.bottom).toBe(70)
        })

        it('calculates center', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            expect(bb.centerX).toBe(60)
            expect(bb.centerY).toBe(45)
        })

        it('min/max are aliases of left/top/right/bottom', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            expect(bb.minX).toBe(bb.left)
            expect(bb.minY).toBe(bb.top)
            expect(bb.maxX).toBe(bb.right)
            expect(bb.maxY).toBe(bb.bottom)
        })
    })

    describe('setters (left/top/right/bottom)', () => {
        it('set left: moves x and adjusts width, right stays the same', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.left = 0
            expect(bb.x).toBe(0)
            expect(bb.width).toBe(110)
            expect(bb.right).toBe(110)
        })

        it('set left: shrinking from left', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.left = 30
            expect(bb.x).toBe(30)
            expect(bb.width).toBe(80) // shrank by 20
            expect(bb.right).toBe(110) // unchanged
        })

        it('set top: moves y and adjusts height, bottom stays the same', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.top = 10
            expect(bb.y).toBe(10)
            expect(bb.height).toBe(60) // grew by 10
            expect(bb.bottom).toBe(70) // unchanged
        })

        it('set top: shrinking from top', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.top = 40
            expect(bb.y).toBe(40)
            expect(bb.height).toBe(30) // shrank by 20
            expect(bb.bottom).toBe(70) // unchanged
        })

        it('set right: adjusts width, left stays the same', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.right = 150
            expect(bb.x).toBe(10) // unchanged
            expect(bb.width).toBe(140) // grew by 40
            expect(bb.left).toBe(10) // unchanged
        })

        it('set right: shrinking from right', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.right = 60
            expect(bb.x).toBe(10)
            expect(bb.width).toBe(50) // shrank by 50
            expect(bb.left).toBe(10)
        })

        it('set bottom: adjusts height, top stays the same', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.bottom = 100
            expect(bb.y).toBe(20) // unchanged
            expect(bb.height).toBe(80) // grew by 30
            expect(bb.top).toBe(20) // unchanged
        })

        it('set bottom: shrinking from bottom', () => {
            const bb = new BoundingBox(10, 20, 100, 50)
            bb.bottom = 40
            expect(bb.y).toBe(20)
            expect(bb.height).toBe(20) // shrank by 30
            expect(bb.top).toBe(20)
        })
    })

    describe('static factories', () => {
        it('createInfinite creates an infinite bounding box', () => {
            const bb = BoundingBox.createInfinite()
            expect(bb.isInfinite()).toBe(true)
            expect(bb.x).toBe(-Infinity)
            expect(bb.y).toBe(-Infinity)
        })

        it('createIndefinite creates an indefinite bounding box', () => {
            const bb = BoundingBox.createIndefinite()
            expect(bb.isIndefinite()).toBe(true)
        })

        it('createWithMerge merges multiple rects', () => {
            const bb = BoundingBox.createWithMerge(
                { left: 0, top: 0, right: 10, bottom: 10 },
                { left: 5, top: 5, right: 20, bottom: 15 },
            )
            expect(bb.left).toBe(0)
            expect(bb.top).toBe(0)
            expect(bb.right).toBe(20)
            expect(bb.bottom).toBe(15)
            expect(bb.width).toBe(20)
            expect(bb.height).toBe(15)
        })
    })

    describe('merge', () => {
        it('expands to encompass another rect', () => {
            const bb = new BoundingBox(10, 10, 10, 10)
            bb.merge({ left: 0, top: 0, right: 5, bottom: 5 })
            expect(bb.left).toBe(0)
            expect(bb.top).toBe(0)
            expect(bb.right).toBe(20)
            expect(bb.bottom).toBe(20)
        })

        it('merges with multiple rects', () => {
            const bb = new BoundingBox(10, 10, 10, 10)
            bb.merge(
                { left: 0, top: 0, right: 5, bottom: 5 },
                { left: 30, top: 30, right: 50, bottom: 50 },
            )
            expect(bb.left).toBe(0)
            expect(bb.top).toBe(0)
            expect(bb.right).toBe(50)
            expect(bb.bottom).toBe(50)
        })

        it('does not shrink when merged rect is inside', () => {
            const bb = new BoundingBox(0, 0, 100, 100)
            bb.merge({ left: 10, top: 10, right: 20, bottom: 20 })
            expect(bb.left).toBe(0)
            expect(bb.top).toBe(0)
            expect(bb.right).toBe(100)
            expect(bb.bottom).toBe(100)
        })
    })

    describe('contains', () => {
        it('returns true for point inside', () => {
            const bb = new BoundingBox(0, 0, 100, 100)
            expect(bb.contains(50, 50)).toBe(true)
        })

        it('returns true for point on edge', () => {
            const bb = new BoundingBox(0, 0, 100, 100)
            expect(bb.contains(0, 0)).toBe(true)
            expect(bb.contains(100, 100)).toBe(true)
        })

        it('returns false for point outside', () => {
            const bb = new BoundingBox(0, 0, 100, 100)
            expect(bb.contains(101, 50)).toBe(false)
            expect(bb.contains(-1, 50)).toBe(false)
        })

        it('returns false for empty bounding box', () => {
            const bb = new BoundingBox(0, 0, 0, 0)
            expect(bb.contains(0, 0)).toBe(false)
        })
    })

    describe('containsRect', () => {
        it('returns true when this contains the other rect', () => {
            const outer = new BoundingBox(0, 0, 100, 100)
            const inner = new BoundingBox(10, 10, 20, 20)
            expect(outer.containsRect(inner)).toBe(true)
        })

        it('returns true for identical rects', () => {
            const bb1 = new BoundingBox(0, 0, 100, 100)
            const bb2 = new BoundingBox(0, 0, 100, 100)
            expect(bb1.containsRect(bb2)).toBe(true)
        })

        it('returns false when other rect extends beyond', () => {
            const outer = new BoundingBox(10, 10, 50, 50)
            const inner = new BoundingBox(0, 0, 100, 100)
            expect(outer.containsRect(inner)).toBe(false)
        })
    })

    describe('state helpers', () => {
        it('isFinite returns true for normal bounding box', () => {
            const bb = new BoundingBox(10, 20, 30, 40)
            expect(bb.isFinite()).toBe(true)
        })

        it('isFinite returns false for infinite bounding box', () => {
            const bb = BoundingBox.createInfinite()
            expect(bb.isFinite()).toBe(false)
        })

        it('isEmpty returns true for zero-sized', () => {
            expect(new BoundingBox(0, 0, 0, 10).isEmpty()).toBe(true)
            expect(new BoundingBox(0, 0, 10, 0).isEmpty()).toBe(true)
        })

        it('isEmpty returns false for non-zero', () => {
            expect(new BoundingBox(0, 0, 10, 10).isEmpty()).toBe(false)
        })

        it('empty() resets all values', () => {
            const bb = new BoundingBox(10, 20, 30, 40)
            bb.empty()
            expect(bb.x).toBe(0)
            expect(bb.y).toBe(0)
            expect(bb.width).toBe(0)
            expect(bb.height).toBe(0)
        })

        it('indefinite() sets indefinite state', () => {
            const bb = new BoundingBox(10, 20, 30, 40)
            bb.indefinite()
            expect(bb.isIndefinite()).toBe(true)
        })

        it('infinite() sets infinite state', () => {
            const bb = new BoundingBox(10, 20, 30, 40)
            bb.infinite()
            expect(bb.isInfinite()).toBe(true)
        })
    })
})
