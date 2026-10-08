import { describe, it, expect } from 'vitest'
import { CommandRegistry } from '../CommandRegistry'
import { DeleteCommand } from '../Delete'
import { CloneCommand } from '../Clone'
import { ToggleLockCommand } from '../ToggleLock'
import { ChangeZIndex } from '../ChangeZIndex'
import { ChangeBgColor } from '../ChangeBgColor'
import { ChangeBorderColor } from '../ChangeBorderColor'
import { ChangeRoundness } from '../ChangeRoundness'

describe('CommandRegistry', () => {
    it('registers the default commands', () => {
        const registry = new CommandRegistry()

        expect(registry.get('delete')).toBeInstanceOf(DeleteCommand)
        expect(registry.get('clone')).toBeInstanceOf(CloneCommand)
        expect(registry.get('toggleLock')).toBeInstanceOf(ToggleLockCommand)
        expect(registry.get('changeZIndex')).toBeInstanceOf(ChangeZIndex)
        expect(registry.get('changeBgColor')).toBeInstanceOf(ChangeBgColor)
        expect(registry.get('changeRoundness')).toBeInstanceOf(ChangeRoundness)
    })

    it('returns undefined for unregistered commands', () => {
        expect(new CommandRegistry().get('changeBorderColor')).toBeUndefined()
    })

    it('registers a command under a name', () => {
        const registry = new CommandRegistry()
        const command = new ChangeBorderColor('changeBorderColor')

        registry.registerCommand('changeBorderColor', command)

        expect(registry.get('changeBorderColor')).toBe(command)
    })
})
