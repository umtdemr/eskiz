import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ShortcutService } from '../ShortcutService'
import type { Engine } from '@/core/engine/Engine'
import type { MouseController } from '@/core/engine/MouseController'

let engine: {
    textEditor: { isActive: boolean }
    executeShortcut: ReturnType<typeof vi.fn>
}
let mouse: { isMouseDown: boolean }
let service: ShortcutService
let onKeyDown: (e: KeyboardEvent) => void

const press = (target: Partial<HTMLElement> | null = null, rest = {}) => {
    const e = {
        key: 'Delete',
        code: 'Delete',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        defaultPrevented: false,
        isComposing: false,
        target,
        preventDefault: vi.fn(),
        ...rest,
    }
    onKeyDown(e as unknown as KeyboardEvent)
    return e
}

const element = (tagName: string, rest: Partial<HTMLElement> = {}) => ({
    tagName,
    isContentEditable: false,
    closest: vi.fn(() => null),
    ...rest,
})

describe('ShortcutService', () => {
    beforeEach(() => {
        vi.stubGlobal('window', {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })
        engine = {
            textEditor: { isActive: false },
            executeShortcut: vi.fn(() => true),
        }
        mouse = { isMouseDown: false }
        service = new ShortcutService(
            engine as unknown as Engine,
            mouse as unknown as MouseController,
        )
        onKeyDown = vi.mocked(window.addEventListener).mock.calls[0][1] as (
            e: KeyboardEvent,
        ) => void
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('runs the bound command and prevents the default', () => {
        const e = press(element('CANVAS'))

        expect(engine.executeShortcut).toHaveBeenCalledWith(e)
        expect(e.preventDefault).toHaveBeenCalled()
    })

    it('leaves unbound keys alone', () => {
        engine.executeShortcut.mockReturnValue(false)

        const e = press()

        expect(e.preventDefault).not.toHaveBeenCalled()
    })

    it.each([
        ['an input', element('INPUT')],
        ['a textarea', element('TEXTAREA')],
        ['an editable element', element('DIV', { isContentEditable: true })],
        ['a dialog', element('BUTTON', { closest: vi.fn(() => ({})) })],
    ])('ignores keys in %s', (_, target) => {
        const e = press(target as Partial<HTMLElement>)

        expect(engine.executeShortcut).not.toHaveBeenCalled()
        expect(e.preventDefault).not.toHaveBeenCalled()
    })

    it('ignores keys while editing text', () => {
        engine.textEditor.isActive = true
        press()
        expect(engine.executeShortcut).not.toHaveBeenCalled()
    })

    it('ignores keys while the mouse is down', () => {
        mouse.isMouseDown = true
        press()
        expect(engine.executeShortcut).not.toHaveBeenCalled()
    })

    it('ignores handled and composing keys', () => {
        press(null, { defaultPrevented: true })
        press(null, { isComposing: true })
        expect(engine.executeShortcut).not.toHaveBeenCalled()
    })

    it('ignores keys when disabled', () => {
        service.disable()
        press()
        expect(engine.executeShortcut).not.toHaveBeenCalled()
    })

    it('stops listening on dispose', () => {
        service.dispose()
        expect(window.removeEventListener).toHaveBeenCalledWith(
            'keydown',
            onKeyDown,
        )
    })
})
