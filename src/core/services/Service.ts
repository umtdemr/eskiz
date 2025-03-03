import { Engine } from "../engine/Engine";

export interface IService {
    init?: () => void
    dispose?: () => void
}

export class Service {
    protected _enabled: boolean = true
    engine: Engine
    
    constructor(engine: Engine) {
        this.engine = engine;
    }

    enable() {
        this._enabled = true;
    }
    disable() {
        this._enabled = false;
    }

    get enabled() {
        return this._enabled
    }

    dispose() {}
}