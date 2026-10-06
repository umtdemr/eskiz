import { vi } from 'vitest'
import { SelectionService } from '@/core/services/SelectionService'
import { Signal } from '@/core/signal/Signal'
import type { CommandCtx } from '@/core/command/Command'
import type { Engine } from '@/core/engine/Engine'
import type { ToolService } from '@/core/services/ToolService'
import type { WidgetsService } from '@/core/services/WidgetsService'
import type { Widget } from '@/core/shapes/Widget'

/**
 * Engine stand-in that records every call commands make. Each
 * `transactionHandler.begin` hands out a new id (tx-1, tx-2, ...) so tests can
 * check which transaction was updated or committed.
 *
 * `services` is what `engine.getService(name)` returns, e.g.
 * `createEngineMock({ widgets: { deleteWidget: vi.fn() } })`.
 */
export function createEngineMock(services: Record<string, unknown> = {}) {
    let nextId = 0
    const mock = {
        canvas: { requestRender: vi.fn() },
        textEditor: { changeTextColor: vi.fn() },
        transactionHandler: {
            begin: vi.fn(
                // params are only here so mock.calls is typed
                (
                    _type: string,
                    _props: { editTable: Map<Widget, string[]> },
                ) => ({
                    transactionId: `tx-${++nextId}`,
                }),
            ),
            update: vi.fn((_id: string) => {}),
            commit: vi.fn((_id: string, _addToHistory?: boolean) => {}),
        },
        getService: vi.fn((name: string) => {
            if (!(name in services)) {
                throw new Error(`service "${name}" is not mocked`)
            }
            return services[name]
        }),
    }

    return mock as typeof mock & Engine
}

export type EngineMock = ReturnType<typeof createEngineMock>

/**
 * A real SelectionService with `widgets` selected. Tool/widgets services are
 * replaced by bare signals since selection only subscribes to them.
 */
export function createSelectionService(
    engine: EngineMock,
    widgets: Widget[] = [],
): SelectionService {
    const toolService = { mainModeChanged: new Signal() }
    const widgetsService = {
        widgetDeleted: new Signal(),
        widgetLockStateChanged: new Signal(),
    }

    const selection = new SelectionService(
        engine,
        toolService as unknown as ToolService,
        widgetsService as unknown as WidgetsService,
    )
    selection.selectWidgets(widgets)

    // selecting requests a render; reset so tests only see the command's calls
    engine.canvas.requestRender.mockClear()

    return selection
}

export interface CommandCtxOptions {
    selected?: Widget[]
    isContinuous?: boolean
    params?: Record<string, unknown>
}

/** Builds a CommandCtx around the given engine mock and selection. */
export function createCommandCtx(
    engine: EngineMock,
    { selected = [], isContinuous = false, params }: CommandCtxOptions = {},
): CommandCtx {
    return {
        engine,
        selectionService: createSelectionService(engine, selected),
        isContinuous,
        params,
    }
}
