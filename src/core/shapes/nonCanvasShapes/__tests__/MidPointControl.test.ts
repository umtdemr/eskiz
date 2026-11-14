import { describe, it, expect, vi } from 'vitest'
import { MidPointControl } from '../MidPointControl'
import { Signal } from '@/core/signal/Signal'
import { makeLine } from '@/test/commandUtils'
import type { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import type { SelectionService } from '@/core/services/SelectionService'
import type { Layer } from '@/core/stage/Layer'

const setup = () => {
    const start = vi.fn()
    const engine = {
        canvas: { requestRender: () => {}, tickBefore: new Signal() },
        reshapeHandler: { start },
    } as unknown as Engine
    const line = makeLine(engine)
    const control = new MidPointControl(
        { pointIndex: 0, x: 0, y: 0, selectionLayer: {} as Layer },
        engine,
        { selected: [line] } as unknown as SelectionService,
    )
    return { engine, line, control, start }
}

describe('MidPointControl', () => {
    it('sits in the middle of the segment', () => {
        const { control } = setup()

        expect([control.left, control.top]).toEqual([50, 50])
    })

    it('follows the line', () => {
        const { engine, line, control } = setup()

        line.move(100, 0)
        engine.canvas.tickBefore.dispatch()

        expect([control.left, control.top]).toEqual([150, 50])
    })

    it('is not hit when the segment is too short on screen', () => {
        const { control } = setup()

        expect(control.contains(50, 50, 1)).toBe(true)
        expect(control.contains(50, 50, 0.1)).toBe(false)
    })

    it('inserts a point after the segment start', () => {
        const { line, control, start } = setup()
        const data = {} as CanvasMouseEvent

        control.onMouseDown(data)

        expect(start).toHaveBeenCalledWith(data, line, 1, [50, 50])
    })
})
