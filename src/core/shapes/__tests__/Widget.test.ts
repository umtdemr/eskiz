import { describe, it, expect, vi } from 'vitest'
import { Rectangle } from '../Rectangle'
import { createEngineStub } from '@/test/testUtils'
import { CANVAS_COLORS } from '@/helpers/Constant'

const engine = createEngineStub()

// Widget is abstract; Rectangle is the simplest concrete widget to test the
// shared geometry / hit-testing / state behavior with.
const makeWidget = (props?: {
    x?: number
    y?: number
    width?: number
    height?: number
    angle?: number
}) =>
    new Rectangle(
        {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            properties: {},
            ...props,
        },
        engine,
    )

describe('Widget geometry', () => {
    it('derives right/bottom/center from position and size', () => {
        const widget = makeWidget()

        expect(widget.left).toBe(10)
        expect(widget.top).toBe(20)
        expect(widget.right).toBe(110)
        expect(widget.bottom).toBe(70)
        expect(widget.centerX).toBe(60)
        expect(widget.centerY).toBe(45)
    })

    it('moves the widget when setting the edges', () => {
        const widget = makeWidget()

        widget.right = 150
        expect(widget.left).toBe(50)
        widget.bottom = 100
        expect(widget.top).toBe(50)

        expect(widget.bounds.x).toBe(50)
        expect(widget.bounds.y).toBe(50)
    })

    it('updates bounds when moved', () => {
        const widget = makeWidget()

        widget.move(200, 300)

        expect(widget.left).toBe(200)
        expect(widget.top).toBe(300)
        expect(widget.bounds).toMatchObject({
            x: 200,
            y: 300,
            width: 100,
            height: 50,
        })
    })

    it('resize applies all given values at once', () => {
        const widget = makeWidget()

        const resized = widget.resize({
            left: 0,
            top: 5,
            width: 40,
            height: 30,
        })

        expect(resized).toBe(true)
        expect(widget.getBoundingRect()).toEqual({
            x: 0,
            y: 5,
            width: 40,
            height: 30,
        })
    })

    it('resize with no values reports no change', () => {
        const widget = makeWidget()

        expect(widget.resize({})).toBe(false)
    })
})

describe('Widget rotation', () => {
    it('normalizes angles into [0, 360)', () => {
        const widget = makeWidget()

        widget.rotate(-90)
        expect(widget.angle).toBe(270)

        widget.rotate(450)
        expect(widget.angle).toBe(90)

        widget.rotate(360)
        expect(widget.angle).toBe(0)
    })

    it('expands the bounds to the rotated AABB', () => {
        const widget = makeWidget({ x: 20, y: 40, width: 60, height: 20 })

        widget.rotate(90)

        // rotated around center (50,50) the 60x20 rect becomes 20x60
        expect(widget.bounds.x).toBeCloseTo(40, 6)
        expect(widget.bounds.y).toBeCloseTo(20, 6)
        expect(widget.bounds.width).toBeCloseTo(20, 6)
        expect(widget.bounds.height).toBeCloseTo(60, 6)
    })

    it('rotating a square by 45deg grows the AABB by sqrt(2)', () => {
        const widget = makeWidget({ x: 0, y: 0, width: 100, height: 100 })

        widget.rotate(45)

        expect(widget.bounds.width).toBeCloseTo(100 * Math.SQRT2, 6)
        expect(widget.bounds.height).toBeCloseTo(100 * Math.SQRT2, 6)
        expect(widget.bounds.x).toBeCloseTo(50 - 50 * Math.SQRT2, 6)
        expect(widget.bounds.y).toBeCloseTo(50 - 50 * Math.SQRT2, 6)
    })
})

describe('Widget hit testing (contains)', () => {
    it('detects points inside and outside without rotation', () => {
        const widget = makeWidget({ x: 10, y: 10, width: 40, height: 30 })

        expect(widget.contains(30, 25, 1)).toBe(true)
        expect(widget.contains(5, 5, 1)).toBe(false)
        expect(widget.contains(55, 25, 1)).toBe(false)
    })

    it('scales the point before testing', () => {
        const widget = makeWidget({ x: 10, y: 10, width: 40, height: 30 })

        // (15, 12.5) at 2x zoom hits (30, 25) in world space
        expect(widget.contains(15, 12.5, 2)).toBe(true)
        expect(widget.contains(30, 25, 2)).toBe(false)
    })

    it('respects rotation', () => {
        const widget = makeWidget({ x: 20, y: 40, width: 60, height: 20 })
        widget.rotate(90)

        // after rotation the widget covers x:[40,60] y:[20,80]
        expect(widget.contains(50, 25, 1)).toBe(true)
        // inside the unrotated rect, outside the rotated one
        expect(widget.contains(25, 50, 1)).toBe(false)
    })
})

describe('Widget relative points', () => {
    it('maps relative corners to absolute points', () => {
        const widget = makeWidget({ x: 10, y: 20, width: 100, height: 50 })

        expect(widget.getPointFromRelative(-1, -1)).toEqual({ x: 10, y: 20 })
        expect(widget.getPointFromRelative(1, 1)).toEqual({ x: 110, y: 70 })
        expect(widget.getPointFromRelative(0, 0)).toEqual({ x: 60, y: 45 })
    })

    it('round-trips through getRelativeFromPoint with rotation', () => {
        const widget = makeWidget({ x: 10, y: 20, width: 100, height: 50 })
        widget.rotate(30)

        const point = widget.getPointFromRelative(0.5, -0.75)
        const relative = widget.getRelativeFromPoint(point.x, point.y)

        expect(relative.rx).toBeCloseTo(0.5, 6)
        expect(relative.ry).toBeCloseTo(-0.75, 6)
    })

    it('exposes the four side midpoints as snap points', () => {
        const widget = makeWidget({ x: 0, y: 0, width: 100, height: 50 })

        expect(widget.getSnapPoints()).toEqual([
            { x: 0, y: 25 }, // left center
            { x: 100, y: 25 }, // right center
            { x: 50, y: 0 }, // top center
            { x: 50, y: 50 }, // bottom center
        ])
    })
})

describe('Widget state', () => {
    it('applies partial updates from the server', () => {
        const widget = makeWidget()

        widget.updateWithPartialState({
            x: 5,
            y: 6,
            width: 70,
            height: 30,
            angle: 45,
            is_locked: true,
        })

        expect(widget.getBoundingRect()).toEqual({
            x: 5,
            y: 6,
            width: 70,
            height: 30,
        })
        expect(widget.angle).toBe(45)
        expect(widget.isLocked).toBe(true)
    })

    it('merges properties on partial update', () => {
        const widget = makeWidget()

        widget.updateWithPartialState({
            properties: { fillColor: CANVAS_COLORS.RED },
        })

        expect(widget.properties.fillColor).toEqual(CANVAS_COLORS.RED)
        // untouched defaults survive the merge
        expect(widget.properties.strokeColor).toEqual(CANVAS_COLORS.BLACK)
    })

    it('is not visible once deleted', () => {
        const widget = makeWidget()
        expect(widget.visible).toBe(true)

        widget.updateWithPartialState({ is_deleted: true })

        expect(widget.isDeleted).toBe(true)
        expect(widget.visible).toBe(false)
    })

    it('dispatches signals on bounds change and deletion', () => {
        const widget = makeWidget()
        const onBoundsChanged = vi.fn()
        const onDeleted = vi.fn()
        widget.boundsChanged.add(onBoundsChanged)
        widget.deleted.add(onDeleted)

        widget.move(50, 50)
        expect(onBoundsChanged).toHaveBeenCalledTimes(1)

        widget.delete()
        expect(onDeleted).toHaveBeenCalledTimes(1)
        expect(widget.isDeleted).toBe(true)
    })

    it('keeps the first uuid it was given', () => {
        const widget = makeWidget()

        widget.uuid = 'first'
        widget.uuid = 'second'

        expect(widget.uuid).toBe('first')
    })
})
