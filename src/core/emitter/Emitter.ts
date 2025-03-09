type Listener<T> = (data: T) => void | boolean;

export class Emitter<EventMap extends Record<string, any>>  {
    private listeners = new Map<keyof EventMap, Array<{
        fn: Listener<any>;
        once?: boolean;
        context?: any;
        removed?: boolean;
    }>>();

    private inDispatch = false;
    private needsCleanup = false;

    on<K extends keyof EventMap>(
        event: K,
        listener: Listener<EventMap[K]>,
        context?: any
    ): () => void {
        return this._addListener(event, listener, false, context);
    }

    once<K extends keyof EventMap>(
        event: K,
        listener: Listener<EventMap[K]>,
        context?: any
    ): () => void {
        return this._addListener(event, listener, true, context);
    }

    private _addListener<K extends keyof EventMap>(
        event: K,
        listener: Listener<EventMap[K]>,
        once: boolean,
        context?: any
    ): () => void {
        const entry = { fn: listener, once, context, removed: false };
        const entries = this.listeners.get(event) || [];
        entries.push(entry);
        this.listeners.set(event, entries);
        
        return () => this.off(event, listener, context);
    }

    off<K extends keyof EventMap>(
        event: K,
        listener?: Listener<EventMap[K]>,
        context?: any
    ): void {
        const entries = this.listeners.get(event);
        if (!entries) return;

        if (!listener) {
            // Remove all listeners for event
            if (this.inDispatch) {
                let needsMark = false;
                for (const entry of entries) {
                    if (!entry.removed) {
                        entry.removed = true
                        needsMark = true
                    }
                }
                if (needsMark) this.needsCleanup = true;
            } else {
                this.listeners.delete(event);
            }
            return;
        }

        const index = entries.findIndex(e => 
            e.fn === listener && 
            e.context === context &&
            !e.removed
        );

        if (index === -1) return;

        if (this.inDispatch) {
            entries[index].removed = true;
            this.needsCleanup = true;
        } else {
            entries.splice(index, 1);
        }
    }

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean {
        const entries = this.listeners.get(event);
        if (!entries) return false;

        let shouldStop = false;
        this.inDispatch = true;

        for (const entry of entries) {
            if (entry.removed) continue;

            try {
                const result = entry.context 
                    ? entry.fn.call(entry.context, data)
                    : entry.fn(data);
                
                if (result === false) shouldStop = true;
                if (entry.once) this.off(event, entry.fn, entry.context);
            } catch (error) {
                console.error('Emitter error:', error);
            }

            if (shouldStop) break;
        }

        this.inDispatch = false;
        
        if (this.needsCleanup) {
            this.listeners.set(event, entries.filter(e => !e.removed));
            this.needsCleanup = false;
        }

        return shouldStop;
    }
    
    hasListeners<K extends keyof EventMap>(event: K): boolean {
        return !!this.listeners.get(event)?.length;
    }

    clear() {
        this.listeners.clear();
    }
}