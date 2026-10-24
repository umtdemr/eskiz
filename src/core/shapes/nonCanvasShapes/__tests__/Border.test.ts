import { describe, it, expect } from 'vitest'
import { Border } from '../Border'
import { Rectangle } from '@/core/shapes/Rectangle'
import { Signal } from '@/core/signal/Signal'
import type { Engine } from '@/core/engine/Engine'
import type { Layer } from '@/core/stage/Layer'

const makeEngine = () =>
    ({
        canvas: {
            requestRender: () => {},
            tickBefore: new Signal(),
            tick: new Signal(),
        },
    }) as unknown as Engine

const setup = () => {
    const engine = makeEngine()
    const rect = new Rectangle(
        { x: 0, y: 0, width: 100, height: 50, properties: {} },
        engine,
    )
    const border = new Border(
        { widgets: [rect], parentLayer: {} as Layer },
        engine,
    )
    return { engine, rect, border }
}

describe('Border', () => {
    it('follows the widget before the next render', () => {
        const { engine, rect, border } = setup()

        rect.move(200, 120)
        engine.canvas.tickBefore.dispatch()

        expect(border.left).toBe(200)
        expect(border.top).toBe(120)
    })

    it('stops following after destroy', () => {
        const { engine, rect, border } = setup()

        border.destroy()
        rect.move(200, 120)
        engine.canvas.tickBefore.dispatch()

        expect(border.left).toBe(0)
    })
})
