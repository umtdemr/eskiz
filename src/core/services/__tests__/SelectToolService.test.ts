import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SelectToolService } from '../SelectToolService'
import { Signal } from '@/core/signal/Signal'
import {
    createEngineMock,
    createSelectionService,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'
import type { MouseController } from '@/core/engine/MouseController'
import type { ToolService } from '../ToolService'
import type { SelectionService } from '../SelectionService'
import type { CanvasMouseEvent } from '@/core/engine/Engine'
import type { Widget } from '@/core/shapes/Widget'

let engine: EngineMock
let service: SelectToolService
let selection: SelectionService
let onBorder: boolean
let underPointer: Widget | null

const rightClick = () =>
    service.onContextMenu({
        e: { clientX: 30, clientY: 40 },
        pointer: { x: 0, y: 0 },
    } as unknown as CanvasMouseEvent)

describe('SelectToolService', () => {
    beforeEach(() => {
        engine = createEngineMock({ cursor: {} })
        Object.assign(engine, { stagesInitiated: new Signal() })
        service = new SelectToolService(
            engine,
            {} as MouseController,
            { mainModeChanged: new Signal() } as unknown as ToolService,
        )

        onBorder = false
        underPointer = null
        selection = createSelectionService(engine)
        Object.assign(service, {
            selectionService: selection,
            selectionLayer: {
                selectionBorder: { contains: () => onBorder },
            },
        })
        vi.spyOn(service, 'checksObjectsInLayer').mockImplementation(
            () => underPointer,
        )
    })

    it('does not select on a cancelled press', () => {
        const data = { pointer: { x: 0, y: 0 } } as CanvasMouseEvent
        Object.assign(service, {
            dragHandler: { start: vi.fn(), end: vi.fn(() => false) },
        })
        underPointer = makeRect(engine)

        service.onMouseDown(data)
        service.onMouseCancel(data)

        expect(selection.selected).toEqual([])
    })

    it('selects the widget under the pointer and opens', () => {
        const opened = vi.fn()
        service.contextMenuOpened.add(opened)
        selection.selectWidget(makeRect(engine))
        underPointer = makeRect(engine)

        rightClick()

        expect(selection.selected).toEqual([underPointer])
        expect(opened).toHaveBeenCalledWith({ x: 30, y: 40 })
    })

    it('keeps the selection when clicked on it', () => {
        const selected = [makeRect(engine), makeRect(engine)]
        selection.selectWidgets(selected)
        underPointer = selected[0]
        onBorder = true

        rightClick()

        expect(selection.selected).toEqual(selected)
    })

    it('clears the selection on empty space and stays closed', () => {
        const opened = vi.fn()
        service.contextMenuOpened.add(opened)
        selection.selectWidget(makeRect(engine))

        rightClick()

        expect(selection.selected).toEqual([])
        expect(opened).not.toHaveBeenCalled()
    })
})
