import { describe, it, expect, beforeEach } from 'vitest'
import {
    createEngineMock,
    createSelectionService,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import { Layer } from '@/core/stage/Layer'
import { BoundingBox } from '@/core/geometry/BoundingBox'
import type { Rectangle } from '@/core/shapes/Rectangle'
import type { SelectionService } from '../SelectionService'

let engine: EngineMock
let selection: SelectionService
let a: Rectangle
let b: Rectangle
let c: Rectangle

// rects are 100x50
const rectAt = (x: number) => {
    const rect = makeRect(engine)
    rect.move(x, 0)
    return rect
}

// covers the rects between `from` and `to` on x
const area = (from: number, to: number) =>
    new BoundingBox(from - 1, -1, to - from + 2, 52)

describe('SelectionService', () => {
    beforeEach(() => {
        engine = createEngineMock()
        const layer = new Layer({ name: 'widgets' })
        a = rectAt(0)
        b = rectAt(200)
        c = rectAt(400)
        layer.addChildren(a, b, c)
        Object.assign(engine, { stage: { widgetsDefaultLayer: layer } })
        selection = createSelectionService(engine)
    })

    describe('selectRectangularArea', () => {
        it('marks what it selects', () => {
            selection.selectRectangularArea(area(0, 300))

            expect(selection.selected).toEqual([a, b])
            expect([a.selected, b.selected, c.selected]).toEqual([
                true,
                true,
                false,
            ])
        })

        it('replaces the selection', () => {
            selection.selectWidget(c)

            selection.selectRectangularArea(area(0, 100))

            expect(selection.selected).toEqual([a])
            expect(c.selected).toBe(false)
        })

        it('adds to the selection', () => {
            selection.selectWidget(c)

            selection.selectRectangularArea(area(0, 100), true)

            expect(selection.selected).toEqual([c, a])
        })

        it('previews the added area with the selection', () => {
            selection.selectWidget(c)

            selection.selectObjectsWithDrawing(area(0, 100), true)

            expect(selection.selectedDuringDrawing).toEqual([c, a])
        })

        it('clears on an empty area', () => {
            selection.selectWidget(c)

            selection.selectRectangularArea(area(600, 700))

            expect(selection.selected).toEqual([])
        })
    })

    describe('toggleWidget', () => {
        it('adds and takes out', () => {
            selection.selectWidget(a)

            selection.toggleWidget(b)
            expect(selection.selected).toEqual([a, b])

            selection.toggleWidget(a)
            expect(selection.selected).toEqual([b])
            expect(a.selected).toBe(false)
        })

        it('clears when the last one goes', () => {
            selection.selectWidget(a)

            selection.toggleWidget(a)

            expect(selection.selected).toEqual([])
        })
    })
})
