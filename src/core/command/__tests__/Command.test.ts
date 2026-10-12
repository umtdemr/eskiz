import { describe, it, expect } from 'vitest'
import { KeyInput, matchesShortcut } from '../Command'

const keys = (key: string, rest: Partial<KeyInput> = {}): KeyInput => ({
    key,
    code: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...rest,
})

describe('matchesShortcut', () => {
    it('ignores the case of the key', () => {
        const redo = { key: 'z', mod: true, shift: true }
        expect(
            matchesShortcut(redo, keys('Z', { ctrlKey: true, shiftKey: true })),
        ).toBe(true)
    })

    it('matches the code too', () => {
        const shortcut = { key: 'BracketRight', mod: true }
        expect(
            matchesShortcut(
                shortcut,
                keys('ü', { code: 'BracketRight', ctrlKey: true }),
            ),
        ).toBe(true)
    })

    it('takes ctrl or cmd as mod', () => {
        const shortcut = { key: 'd', mod: true }
        expect(matchesShortcut(shortcut, keys('d', { ctrlKey: true }))).toBe(
            true,
        )
        expect(matchesShortcut(shortcut, keys('d', { metaKey: true }))).toBe(
            true,
        )
        expect(matchesShortcut(shortcut, keys('d'))).toBe(false)
    })

    it('needs the modifiers to match exactly', () => {
        expect(
            matchesShortcut({ key: 'v' }, keys('v', { ctrlKey: true })),
        ).toBe(false)
        expect(
            matchesShortcut({ key: 'v' }, keys('V', { shiftKey: true })),
        ).toBe(false)
        expect(matchesShortcut({ key: 'v' }, keys('v', { altKey: true }))).toBe(
            false,
        )
        expect(
            matchesShortcut(
                { key: 'z', mod: true },
                keys('z', { ctrlKey: true, shiftKey: true }),
            ),
        ).toBe(false)
    })

    it('handles a missing key', () => {
        const input = { ...keys('a'), key: undefined } as unknown as KeyInput
        expect(matchesShortcut({ key: 'a' }, input)).toBe(false)
    })
})
