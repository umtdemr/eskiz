import { describe, it, expect } from 'vitest'
import { CommandRegistry } from '../CommandRegistry'
import { Command, Commands } from '../Command'
import { ChangeBgColor } from '../ChangeBgColor'
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
    const services: Record<string, unknown> = {}
    const engine = createEngineMock(services)
    const selected = makeSelected(engine)
    services.selection = createSelectionService(engine, selected)
    return { engine, selected }
}

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
]

describe('CommandRegistry', () => {
    it.each(names)('registers %s', (name) => {
        expect(new CommandRegistry().get(name)).toBeInstanceOf(Command)
    })

    it('replaces a command under the same name', () => {
        const registry = new CommandRegistry()
        const command = new ChangeBgColor('changeBgColor')

        registry.registerCommand('changeBgColor', command)

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
            const { engine, selected } = setup((e) => [makeRect(e)])
            const other = makeRect(engine)

            new CommandRegistry().execute(
                engine,
                'changeRoundness',
                { roundness: 12 },
                { widgets: [other] },
            )

            expect(other.properties.radius).toBe(12)
            expect(selected[0].properties.radius).toBeUndefined()
        })
    })
})
