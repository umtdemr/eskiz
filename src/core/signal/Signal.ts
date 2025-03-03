import { SignalStorage } from './SignalStorage';

// Signal implementation 
// https://github.com/millermedeiros/js-signals/ and ts-signals

export class Signal<T = void> {
    private storage: SignalStorage<T>;
    private active: boolean;
    private memorize: boolean;
    private lastValues?: T[];
    private stopPropagation: boolean = false;

    constructor(options: { active?: boolean; memorize?: boolean; storage?: SignalStorage<T> } = {}) {
        this.active = options.active ?? true;
        this.memorize = options.memorize ?? false;
        this.storage = options.storage ?? new SignalStorage<T>();
    }

    add(callback: (...args: T[]) => void, context?: unknown): void {
        this.registerListener(callback, false, context);
    }

    addOnce(callback: (...args: T[]) => void, context?: unknown): void {
        this.registerListener(callback, true, context);
    }

    remove(callback: (...args: T[]) => void, context?: unknown): boolean {
        return this.storage.remove(callback, context);
    }

    removeAll(): void {
        this.storage.clear();
    }

    dispatch(...args: T[]): void {
        if (!this.active) return;

        if (this.memorize) {
            this.lastValues = args;
        }

        this.stopPropagation = false;
        this.storage.forEach(listener => {
            if (this.stopPropagation) return false;
            listener.execute(...args);
            return true;
        });
    }

    dispose(): void {
        this.removeAll();
        this.forget();
    }

    forget(): void {
        this.lastValues = undefined;
    }

    getValues(): T[] | undefined {
        return this.lastValues;
    }

    getNumListeners(): number {
        return this.storage.size();
    }

    getDidHalt(): boolean {
        return this.stopPropagation;
    }

    halt(): void {
        this.stopPropagation = true;
    }

    has(callback: (...args: T[]) => void, context?: unknown): boolean {
        return this.storage.has(callback, context);
    }

    private registerListener(callback: (...args: T[]) => void, isOnce: boolean, context?: unknown): void {
        if (context !== undefined && !this.storage.supportsContext) {
            throw new Error('Current signal storage doesn\'t support context');
        }

        let listener = this.storage.get(callback, context);
        
        if (listener !== undefined) {
            if (listener.isOnce !== isOnce) {
                throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
            }
        } else {
            listener = {
                callback,
                context,
                isOnce,
                execute: (...args: T[]) => {
                    callback.apply(context, args);
                    if (isOnce) {
                        this.remove(callback, context);
                    }
                }
            };
            this.storage.add(listener);
        }

        if (this.memorize && this.lastValues !== undefined) {
            listener.execute(...this.lastValues);
        }
    }
} 