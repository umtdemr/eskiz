import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZoomToFit } from '../ZoomToFit'
import { matchesShortcut } from '../Command'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
} from '@/test/commandUtils'
import { BoundingBox } from '@/core/geometry/BoundingBox'

let engine: EngineMock
let bounds: BoundingBox | null

describe('ZoomToFit', () => {
    let command: ZoomToFit

    beforeEach(() => {
        engine = createEngineMock()
        bounds = new BoundingBox(0, 0, 100, 100)
        Object.assign(engine, {
            stage: { contentBounds: () => bounds },
            zoomToFit: vi.fn(),
        })
        command = new ZoomToFit()
    })

    it('runs on shift 1, whatever the layout types', () => {
        const input = {
            key: '!',
            code: 'Digit1',
            shiftKey: true,
            ctrlKey: false,
            metaKey: false,
            altKey: false,
        }
        expect(matchesShortcut(command.shortcuts[0], input)).toBe(true)
    })

    it('does nothing on an empty board', () => {
        bounds = null
        expect(command.canExecute(createCommandCtx(engine))).toBe(false)
    })

    it('fits the board', () => {
        command.execute(createCommandCtx(engine))
        expect(engine.zoomToFit).toHaveBeenCalled()
    })
})
