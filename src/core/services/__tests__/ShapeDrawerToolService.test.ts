import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShapeDrawerToolService } from '../ShapeDrawerToolService'
import { Signal } from '@/core/signal/Signal'
import { createEngineMock, EngineMock } from '@/test/commandUtils'
import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'
import type { MouseController } from '@/core/engine/MouseController'
import type { CanvasMouseEvent } from '@/core/engine/Engine'
import type { ToolService } from '../ToolService'
import type { SelectionService } from '../SelectionService'
import type { Shape } from '@/core/shapes/Shape'

let engine: EngineMock
let service: ShapeDrawerToolService
let added: Shape | undefined

const at = (x: number, y: number) =>
    ({
        pointer: { x, y },
        e: { shiftKey: false },
    }) as unknown as CanvasMouseEvent

const draw = (from: [number, number], to: [number, number]) => {
    service.onMouseDown(at(...from))
    service.onMouseMove(at(...to))
    return added!
}

describe('ShapeDrawerToolService', () => {
    beforeEach(() => {
        engine = createEngineMock({ cursor: { setCursor: vi.fn() } })
        added = undefined
        Object.assign(engine, {
            stage: {
                widgetsDefaultLayer: undefined,
                addWidget: (shape: Shape) => (added = shape),
            },
        })

        const subModeChanged = new Signal<{ tool: string; subTool: string }>()
        service = new ShapeDrawerToolService(
            engine,
            { on: vi.fn(), off: vi.fn() } as unknown as MouseController,
            { subModeChanged } as unknown as ToolService,
            {} as SelectionService,
        )
        subModeChanged.dispatch({
            tool: ACTION_MODES.CREATE,
            subTool: SUB_ACTION_MODES.CREATE_RECTANGLE,
        })
    })

    it('draws from the press to the pointer', () => {
        const shape = draw([3, 4], [36, 24])
        expect([shape.left, shape.top, shape.width, shape.height]).toEqual([
            3, 4, 33, 20,
        ])
    })

    it('puts the corners on the grid when snapping', () => {
        engine.settings.set({ isGridSnapEnabled: true })
        const shape = draw([3, 4], [36, 24])
        expect([shape.left, shape.top, shape.width, shape.height]).toEqual([
            0, 0, 40, 20,
        ])
    })

    it('keeps one grid step for a short drag when snapping', () => {
        engine.settings.set({ isGridSnapEnabled: true })
        const shape = draw([3, 3], [4, 4])
        expect([shape.left, shape.top, shape.width, shape.height]).toEqual([
            0, 0, 10, 10,
        ])
    })

    it('grows the way the pointer went on a short drag', () => {
        engine.settings.set({ isGridSnapEnabled: true })
        const shape = draw([3, 3], [2, 2])
        expect([shape.left, shape.top, shape.width, shape.height]).toEqual([
            -10, -10, 10, 10,
        ])
    })
})
