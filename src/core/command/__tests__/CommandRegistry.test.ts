import { describe, it, expect, vi } from 'vitest'
import { CommandRegistry, Commands } from '../CommandRegistry'
import { Command, KeyInput, Shortcut } from '../Command'
import { ChangeBgColor } from '../ChangeBgColor'
import { ChangeTool } from '../ChangeTool'
import {
    createEngineMock,
    createSelectionService,
    makeLine,
    makeRect,
} from '@/test/commandUtils'
import type { Widget } from '@/core/shapes/Widget'
import type { Engine } from '@/core/engine/Engine'

// engine whose selection service has `selected` selected
const setup = (makeSelected: (engine: Engine) => Widget[]) => {
    const toolService = { changeTool: vi.fn() }
    const services: Record<string, unknown> = { toolService }
    const engine = createEngineMock(services)
    const selected = makeSelected(engine)
    services.selection = createSelectionService(engine, selected)
    return { engine, selected, toolService }
}

const keys = (key: string, rest: Partial<KeyInput> = {}): KeyInput => ({
    key,
    code: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...rest,
})

const names: Commands[] = [
    'delete',
    'clone',
    'toggleLock',
    'changeBgColor',
    'changeBorderColor',
    'changeBorderStyle',
    'changeThickness',
    'changeRoundness',
    'changeTextColor',
    'changeHighlightColor',
    'changeTextAlign',
    'changeFontSize',
    'changeFontStyle',
    'changeZIndex',
    'changeLineArrow',
    'undo',
    'redo',
    'selectAll',
    'clearSelection',
    'move',
    'changeTool',
]

describe('CommandRegistry', () => {
    it.each(names)('registers %s', (name) => {
        expect(new CommandRegistry().get(name)).toBeInstanceOf(Command)
    })

    it('replaces a command under the same name', () => {
        const registry = new CommandRegistry()
        const command = new ChangeBgColor()

        registry.registerCommand(command)

        expect(registry.get('changeBgColor')).toBe(command)
    })

    describe('execute', () => {
        it('runs on the selection', () => {
            const { engine, selected } = setup((e) => [makeRect(e)])

            const executed = new CommandRegistry().execute(
                engine,
                'changeRoundness',
                { roundness: 12 },
            )

            expect(executed).toBe(true)
            expect(selected[0].properties.radius).toBe(12)
            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'immediate',
                expect.anything(),
            )
        })

        it('returns false when the command cannot run', () => {
            const { engine } = setup((e) => [makeLine(e)])

            const executed = new CommandRegistry().execute(
                engine,
                'changeRoundness',
                { roundness: 12 },
            )

            expect(executed).toBe(false)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('opens a continuous edit', () => {
            const { engine } = setup((e) => [makeRect(e)])

            new CommandRegistry().execute(
                engine,
                'changeRoundness',
                { roundness: 12 },
                { continuous: true },
            )

            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'continuous',
                expect.anything(),
            )
            expect(engine.transactionHandler.commit).not.toHaveBeenCalled()
        })

        it('uses the given widgets instead of the selection', () => {
            // a line can't be rounded, so only the given rect is checked
            const { engine } = setup((e) => [makeLine(e)])
            const rect = makeRect(engine)

            const executed = new CommandRegistry().execute(
                engine,
                'changeRoundness',
                { roundness: 12 },
                { widgets: [rect] },
            )

            expect(executed).toBe(true)
            expect(rect.properties.radius).toBe(12)
        })

        it('works on more than one selected widget', () => {
            const { engine, selected } = setup((e) => [
                makeRect(e),
                makeRect(e),
            ])

            new CommandRegistry().execute(engine, 'changeRoundness', {
                roundness: 12,
            })

            expect(selected.map((w) => w.properties.radius)).toEqual([12, 12])
        })
    })

    describe('executeShortcut', () => {
        it('runs the command bound to the keys', () => {
            const { engine, selected } = setup((e) => [makeRect(e)])

            const bound = new CommandRegistry().executeShortcut(
                engine,
                keys('ArrowRight'),
            )

            expect(bound).toBe(true)
            expect(selected[0].left).toBe(1)
            expect(engine.transactionHandler.begin).toHaveBeenCalledWith(
                'continuous',
                expect.anything(),
            )
        })

        it('passes the params of the binding', () => {
            const { engine, selected } = setup((e) => [makeRect(e)])

            new CommandRegistry().executeShortcut(
                engine,
                keys('ArrowDown', { shiftKey: true }),
            )

            expect(selected[0].top).toBe(10)
        })

        it('returns false when nothing is bound to the keys', () => {
            const { engine } = setup(() => [])

            expect(
                new CommandRegistry().executeShortcut(engine, keys('q')),
            ).toBe(false)
        })

        it('returns true when the bound command cannot run', () => {
            const { engine } = setup(() => [])

            const bound = new CommandRegistry().executeShortcut(
                engine,
                keys('Delete'),
            )

            expect(bound).toBe(true)
            expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        })

        it('falls through to the next command bound to the keys', () => {
            class EscapeToSelect extends ChangeTool {
                readonly shortcuts: Shortcut<{ tool: 'SELECT' }>[] = [
                    { key: 'Escape', params: { tool: 'SELECT' } },
                ]
            }
            const registry = new CommandRegistry()
            registry.registerCommand(new EscapeToSelect())

            // clear selection comes first and takes it
            const withSelection = setup((e) => [makeRect(e)])
            registry.executeShortcut(withSelection.engine, keys('Escape'))
            expect(withSelection.toolService.changeTool).not.toHaveBeenCalled()

            // nothing to clear
            const empty = setup(() => [])
            registry.executeShortcut(empty.engine, keys('Escape'))
            expect(empty.toolService.changeTool).toHaveBeenCalledWith(
                'SELECT',
                undefined,
            )
        })
    })

    describe('executed', () => {
        it('dispatches the name of the command that ran', () => {
            const { engine } = setup((e) => [makeRect(e)])
            const registry = new CommandRegistry()
            const listener = vi.fn()
            registry.executed.add(listener)

            registry.execute(engine, 'move', { dx: 1, dy: 0 })
            // no targets, can't run
            registry.execute(engine, 'delete', {}, { widgets: [] })

            expect(listener.mock.calls).toEqual([['move']])
        })
    })
})
