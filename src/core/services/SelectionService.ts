import { Engine } from "../engine/Engine";
import { Widget } from "../shapes/Widget";
import { Service } from "./Service";

export class SelectionService extends Service {
    private _selected: Widget[] = []

    constructor(engine: Engine) {
        super(engine)
    }

    singleSelect(widget: Widget) {
        this._selected = [widget]
    }

    clearSelection() {
        this._selected = []
    }

    get selected() {
        return this._selected
    }
}