import { vi } from 'vitest'
import { SelectionService } from '@/core/services/SelectionService'
import { Signal } from '@/core/signal/Signal'
import { ContinuousEdits } from '@/core/command/ContinuousEdits'
import { Rectangle } from '@/core/shapes/Rectangle'
import { Line } from '@/core/shapes/line/Line'
import { Pen } from '@/core/shapes/path/Pen'
import { TextBox } from '@/core/shapes/text/TextBox'
import { TextAlign } from '@/core/constants'
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
            addEditingMethod: vi.fn(
                (
                    _id: string,
                    _widget: Widget,
                    _method: string,
                    _initial?: Record<string, unknown>,
                ) => {},
            ),
        },
        getService: vi.fn((name: string) => {
            if (!(name in services)) {
                throw new Error(`service "${name}" is not mocked`)
            }
            return services[name]
        }),
    }

    const engine = mock as typeof mock & Engine
    // real one, so continuous edits run against the mocked transactions
    Object.assign(mock, { continuousEdits: new ContinuousEdits(engine) })

    return engine
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

export interface MakeWidgetOptions {
    locked?: boolean
    zIndex?: string
}

/** Rectangle without text unless `text` is given. */
export const makeRect = (
    engine: Engine,
    {
        locked = false,
        zIndex,
        text,
    }: MakeWidgetOptions & { text?: string } = {},
) =>
    new Rectangle(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            is_locked: locked,
            z_index: zIndex,
            properties: text
                ? {
                      textProperties: {
                          text,
                          textOps: [{ text, attributes: {} }],
                          fontSize: 14,
                          lineHeight: 1.4,
                          textAlign: TextAlign.CENTER,
                      },
                  }
                : {},
        },
        engine,
    )

export const makeLine = (
    engine: Engine,
    { locked = false }: MakeWidgetOptions = {},
) =>
    new Line(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            is_locked: locked,
            properties: {
                points: [
                    [0, 0],
                    [100, 100],
                ],
            },
        },
        engine,
    )

export const makePen = (
    engine: Engine,
    { locked = false }: MakeWidgetOptions = {},
) =>
    new Pen(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            is_locked: locked,
            properties: {
                points: [
                    [0, 0],
                    [50, 50],
                    [100, 100],
                ],
                strokeWidth: 2,
            },
        },
        engine,
    )

export const makeTextBox = (
    engine: Engine,
    { locked = false }: MakeWidgetOptions = {},
) =>
    new TextBox(
        {
            x: 0,
            y: 0,
            width: 200,
            is_locked: locked,
            properties: { text: 'hello', fontSize: 16 },
        },
        engine,
    )
