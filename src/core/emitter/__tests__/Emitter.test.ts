import { describe, it, expect, vi } from 'vitest'
import { Emitter } from '../Emitter'

type Events = {
    ping: number
    other: string
}

describe('Emitter', () => {
    it('calls listeners with the emitted data', () => {
        const emitter = new Emitter<Events>()
        const listener = vi.fn()
        emitter.on('ping', listener)

        emitter.emit('ping', 42)

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith(42)
    })

    it('does not mix up events', () => {
        const emitter = new Emitter<Events>()
        const listener = vi.fn()
        emitter.on('ping', listener)

        emitter.emit('other', 'hello')

        expect(listener).not.toHaveBeenCalled()
    })

    it('once listeners only fire a single time', () => {
        const emitter = new Emitter<Events>()
        const listener = vi.fn()
        emitter.once('ping', listener)

        emitter.emit('ping', 1)
        emitter.emit('ping', 2)

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith(1)
    })

    it('off removes a specific listener', () => {
        const emitter = new Emitter<Events>()
        const kept = vi.fn()
        const removed = vi.fn()
        emitter.on('ping', kept)
        emitter.on('ping', removed)

        emitter.off('ping', removed)
        emitter.emit('ping', 1)

        expect(kept).toHaveBeenCalledTimes(1)
        expect(removed).not.toHaveBeenCalled()
    })

    it('off without a listener removes all listeners of the event', () => {
        const emitter = new Emitter<Events>()
        const first = vi.fn()
        const second = vi.fn()
        emitter.on('ping', first)
        emitter.on('ping', second)

        emitter.off('ping')
        emitter.emit('ping', 1)

        expect(first).not.toHaveBeenCalled()
        expect(second).not.toHaveBeenCalled()
    })

    it('the subscription returned by on unsubscribes', () => {
        const emitter = new Emitter<Events>()
        const listener = vi.fn()
        const unsubscribe = emitter.on('ping', listener)

        unsubscribe()
        emitter.emit('ping', 1)

        expect(listener).not.toHaveBeenCalled()
    })

    it('binds listeners to the given context', () => {
        const emitter = new Emitter<Events>()
        const context = { seen: 0 }
        emitter.on(
            'ping',
            function (this: typeof context, value: number) {
                this.seen = value
            },
            context,
        )

        emitter.emit('ping', 7)

        expect(context.seen).toBe(7)
    })

    it('a listener returning false stops propagation', () => {
        const emitter = new Emitter<Events>()
        const later = vi.fn()
        emitter.on('ping', () => false)
        emitter.on('ping', later)

        const stopped = emitter.emit('ping', 1)

        expect(stopped).toBe(true)
        expect(later).not.toHaveBeenCalled()
    })

    it('keeps dispatching when a listener throws', () => {
        const emitter = new Emitter<Events>()
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})
        const after = vi.fn()
        emitter.on('ping', () => {
            throw new Error('boom')
        })
        emitter.on('ping', after)

        emitter.emit('ping', 1)

        expect(after).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalled()
        errorSpy.mockRestore()
    })

    it('allows removing a listener while dispatching', () => {
        const emitter = new Emitter<Events>()
        const second = vi.fn()
        const first = vi.fn(() => {
            emitter.off('ping', second)
        })
        emitter.on('ping', first)
        emitter.on('ping', second)

        emitter.emit('ping', 1)
        // the removal is honored within the same dispatch
        expect(second).not.toHaveBeenCalled()

        emitter.emit('ping', 2)
        expect(first).toHaveBeenCalledTimes(2)
        expect(second).not.toHaveBeenCalled()
    })

    it('hasListeners reflects subscriptions', () => {
        const emitter = new Emitter<Events>()
        expect(emitter.hasListeners('ping')).toBe(false)

        const unsubscribe = emitter.on('ping', () => {})
        expect(emitter.hasListeners('ping')).toBe(true)

        unsubscribe()
        expect(emitter.hasListeners('ping')).toBe(false)
    })

    it('clear drops every listener', () => {
        const emitter = new Emitter<Events>()
        const listener = vi.fn()
        emitter.on('ping', listener)
        emitter.on('other', listener)

        emitter.clear()
        emitter.emit('ping', 1)
        emitter.emit('other', 'x')

        expect(listener).not.toHaveBeenCalled()
    })
})
