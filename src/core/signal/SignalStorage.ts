interface SignalListener<T> {
    callback: (...args: T[]) => void;
    context?: unknown;
    isOnce: boolean;
    execute: (...args: T[]) => void;
}

export class SignalStorage<T> {
    protected listeners: Set<SignalListener<T>> = new Set();
    readonly supportsContext: boolean = true;
    readonly supportsPriority: boolean = false;

    add(listener: SignalListener<T>): void {
        this.listeners.add(listener);
    }

    remove(callback: (...args: T[]) => void, context?: unknown): boolean {
        for (const listener of this.listeners) {
            if (listener.callback === callback && listener.context === context) {
                this.listeners.delete(listener);
                return true;
            }
        }
        return false;
    }

    get(callback: (...args: T[]) => void, context?: unknown): SignalListener<T> | undefined {
        for (const listener of this.listeners) {
            if (listener.callback === callback && listener.context === context) {
                return listener;
            }
        }
        return undefined;
    }

    has(callback: (...args: T[]) => void, context?: unknown): boolean {
        return this.get(callback, context) !== undefined;
    }

    clear(): void {
        this.listeners.clear();
    }

    size(): number {
        return this.listeners.size;
    }

    forEach(fn: (listener: SignalListener<T>) => boolean): void {
        for (const listener of this.listeners) {
            if (!fn(listener)) break;
        }
    }
} 