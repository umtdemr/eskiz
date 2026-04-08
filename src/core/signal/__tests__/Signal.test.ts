import { describe, it, expect, vi } from 'vitest'
import { Signal } from '../Signal'

describe('Signal', () => {
    describe('add / dispatch', () => {
        it('dispatches to added listener', () => {
            const signal = new Signal<number>()
            const callback = vi.fn()
            signal.add(callback)
            signal.dispatch(42)
            expect(callback).toHaveBeenCalledWith(42)
        })

        it('dispatches to multiple listeners', () => {
            const signal = new Signal<string>()
            const cb1 = vi.fn()
            const cb2 = vi.fn()
            signal.add(cb1)
            signal.add(cb2)
            signal.dispatch('hello')
            expect(cb1).toHaveBeenCalledWith('hello')
            expect(cb2).toHaveBeenCalledWith('hello')
        })

        it('does not dispatch when inactive', () => {
            const signal = new Signal<void>({ active: false })
            const callback = vi.fn()
            signal.add(callback)
            signal.dispatch()
            expect(callback).not.toHaveBeenCalled()
        })
    })

    describe('addOnce', () => {
        it('only fires once', () => {
            const signal = new Signal<number>()
            const callback = vi.fn()
            signal.addOnce(callback)
            signal.dispatch(1)
            signal.dispatch(2)
            expect(callback).toHaveBeenCalledTimes(1)
            expect(callback).toHaveBeenCalledWith(1)
        })
    })

    describe('remove', () => {
        it('removes a listener', () => {
            const signal = new Signal<number>()
            const callback = vi.fn()
            signal.add(callback)
            signal.remove(callback)
            signal.dispatch(42)
            expect(callback).not.toHaveBeenCalled()
        })

        it('returns true when listener was removed', () => {
            const signal = new Signal<void>()
            const callback = vi.fn()
            signal.add(callback)
            expect(signal.remove(callback)).toBe(true)
        })

        it('returns false when listener was not found', () => {
            const signal = new Signal<void>()
            const callback = vi.fn()
            expect(signal.remove(callback)).toBe(false)
        })
    })

    describe('removeAll', () => {
        it('removes all listeners', () => {
            const signal = new Signal<void>()
            const cb1 = vi.fn()
            const cb2 = vi.fn()
            signal.add(cb1)
            signal.add(cb2)
            signal.removeAll()
            signal.dispatch()
            expect(cb1).not.toHaveBeenCalled()
            expect(cb2).not.toHaveBeenCalled()
        })
    })

    describe('has', () => {
        it('returns true for added listener', () => {
            const signal = new Signal<void>()
            const callback = vi.fn()
            signal.add(callback)
            expect(signal.has(callback)).toBe(true)
        })

        it('returns false for non-added listener', () => {
            const signal = new Signal<void>()
            expect(signal.has(vi.fn())).toBe(false)
        })
    })

    describe('getNumListeners', () => {
        it('tracks listener count', () => {
            const signal = new Signal<void>()
            expect(signal.getNumListeners()).toBe(0)
            const cb = vi.fn()
            signal.add(cb)
            expect(signal.getNumListeners()).toBe(1)
            signal.remove(cb)
            expect(signal.getNumListeners()).toBe(0)
        })
    })

    describe('memorize', () => {
        it('replays last dispatch to new listeners', () => {
            const signal = new Signal<number>({ memorize: true })
            signal.dispatch(99)

            const callback = vi.fn()
            signal.add(callback)
            expect(callback).toHaveBeenCalledWith(99)
        })

        it('does not replay when memorize is off', () => {
            const signal = new Signal<number>({ memorize: false })
            signal.dispatch(99)

            const callback = vi.fn()
            signal.add(callback)
            expect(callback).not.toHaveBeenCalled()
        })

        it('forget clears memorized values', () => {
            const signal = new Signal<number>({ memorize: true })
            signal.dispatch(99)
            signal.forget()

            const callback = vi.fn()
            signal.add(callback)
            expect(callback).not.toHaveBeenCalled()
        })

        it('getValues returns last dispatched values', () => {
            const signal = new Signal<number>({ memorize: true })
            signal.dispatch(42)
            expect(signal.getValues()).toEqual([42])
        })
    })

    describe('halt', () => {
        it('stops propagation to subsequent listeners', () => {
            const signal = new Signal<void>()
            const cb1 = vi.fn(() => signal.halt())
            const cb2 = vi.fn()
            signal.add(cb1)
            signal.add(cb2)
            signal.dispatch()
            expect(cb1).toHaveBeenCalledTimes(1)
            expect(cb2).not.toHaveBeenCalled()
            expect(signal.getDidHalt()).toBe(true)
        })
    })

    describe('dispose', () => {
        it('removes all listeners and clears memory', () => {
            const signal = new Signal<number>({ memorize: true })
            signal.add(vi.fn())
            signal.dispatch(42)
            signal.dispose()
            expect(signal.getNumListeners()).toBe(0)
            expect(signal.getValues()).toBeUndefined()
        })
    })

    describe('context binding', () => {
        it('calls listener with correct context', () => {
            const signal = new Signal<void>()
            const context = { value: 'test' }
            let capturedThis: unknown

            signal.add(function (this: unknown) {
                capturedThis = this
            }, context)

            signal.dispatch()
            expect(capturedThis).toBe(context)
        })
    })

    describe('error cases', () => {
        it('throws when adding same callback with different isOnce', () => {
            const signal = new Signal<void>()
            const callback = vi.fn()
            signal.add(callback)
            expect(() => signal.addOnce(callback)).toThrow()
        })
    })
})
