import { describe, it, expect } from 'vitest'
import { CommandRegistry } from '../CommandRegistry'
import { Command, Commands } from '../Command'
import { ChangeBgColor } from '../ChangeBgColor'

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
})
