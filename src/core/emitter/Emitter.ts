export class Emitter<EventMap extends Record<string, any>>  {
    private eventListeners = {} as {
        [K in keyof EventMap]: ((data: EventMap[K]) => void)[];
    };

    on<K extends keyof EventMap>(eventName: K, callback: (data: EventMap[K]) => void) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [] as {
                [K in keyof EventMap]: ((data: EventMap[K]) => void)[];
            };
        }
        this.eventListeners[eventName].push(callback);
        return () => this.off(eventName, callback);
    }

    off<K extends keyof EventMap>(eventName: K, callback: (data: EventMap[K]) => void) {
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
    }

    emit<K extends keyof EventMap>(eventName: K, data: EventMap[K]) {
        this.eventListeners[eventName].forEach(callback => callback(data));
    }
    
    clearEventListeners() {
        this.eventListeners = {}
    }
}