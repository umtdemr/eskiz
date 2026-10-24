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

const makeRect = (engine: Engine, x = 0, y = 0) =>
    new Rectangle({ x, y, width: 100, height: 50, properties: {} }, engine)

const setup = () => {
    const engine = makeEngine()
    const rect = makeRect(engine)
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

    it('follows every widget of a multi selection', () => {
        const engine = makeEngine()
        const a = makeRect(engine)
        const b = makeRect(engine, 200, 0)
        const border = new Border(
            { widgets: [a, b], parentLayer: {} as Layer },
            engine,
        )

        b.move(200, 100)
        engine.canvas.tickBefore.dispatch()

        expect(border.height).toBe(150)
    })

    it('stops following after destroy', () => {
        const { engine, rect, border } = setup()

        border.destroy()
        rect.move(200, 120)
        engine.canvas.tickBefore.dispatch()

        expect(border.left).toBe(0)
    })
})
