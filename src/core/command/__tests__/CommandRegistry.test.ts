import { describe, it, expect } from 'vitest'
import { CommandRegistry } from '../CommandRegistry'
import { DeleteCommand } from '../Delete'
import { CloneCommand } from '../Clone'
import { ToggleLockCommand } from '../ToggleLock'
import { ChangeZIndex } from '../ChangeZIndex'
import { ChangeBgColor } from '../ChangeBgColor'

describe('CommandRegistry', () => {
    it('registers the default commands', () => {
        const registry = new CommandRegistry()

        expect(registry.get('delete')).toBeInstanceOf(DeleteCommand)
        expect(registry.get('clone')).toBeInstanceOf(CloneCommand)
        expect(registry.get('toggleLock')).toBeInstanceOf(ToggleLockCommand)
        expect(registry.get('changeZIndex')).toBeInstanceOf(ChangeZIndex)
    })

    it('returns undefined for unregistered commands', () => {
        expect(new CommandRegistry().get('changeBgColor')).toBeUndefined()
    })

    it('registers a command under a name', () => {
        const registry = new CommandRegistry()
        const command = new ChangeBgColor('changeBgColor')

        registry.registerCommand('changeBgColor', command)

        expect(registry.get('changeBgColor')).toBe(command)
    })
})
