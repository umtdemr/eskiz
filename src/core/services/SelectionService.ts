import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { BoundingBox } from "../geometry/BoundingBox";
import { Widget } from "../shapes/Widget";
import { Service } from "./Service";
import { Signal } from 'signals'

export class SelectionService extends Service {
    private _selected: Widget[] = []
    private _selectedDuringDrawing: Widget[] = []

    selectionChanged = new Signal()
    drawingSelectionUpdated = new Signal()

    constructor(engine: Engine) {
        super(engine)
    }

    selectWidget(widget: Widget, mouseEvent: CanvasMouseEvent) {
        this._selected = [widget]
        this.selectionChanged.dispatch()
    }

    clearSelection() {
        this._selected = []
        this.selectionChanged.dispatch()
    }

    checkObjectsInRect(rect: BoundingBox): Widget[] {
        const shapesLayer = this.engine.stage.widgetsDefaultLayer; 
        const allWidgets = new Set<Widget>();
        
        for (const child of shapesLayer.children) {
            if (child instanceof Widget) {
                if (!child.interactive) continue;

                if (rect.containsRect(child.bounds)) {
                    allWidgets.add(child)
                } else {
                    allWidgets.delete(child)
                }
            }
        }

        return Array.from(allWidgets)
    }

    selectObjectsWithDrawing(rect: BoundingBox) {
        const allObjects = this.checkObjectsInRect(rect)
        if (allObjects.length !== this._selectedDuringDrawing.length) {
            this._selectedDuringDrawing = allObjects
            this.drawingSelectionUpdated.dispatch()
        }
    }

    selectRectangularArea(rect: BoundingBox) {
        const allObjects = this.checkObjectsInRect(rect)
        if (!allObjects.length) {
            if (this._selected.length) {
                this._selected = []
                this.selectionChanged.dispatch()
            }
            this._selected = []
            return
        }
        this._selected = allObjects
        this.selectionChanged.dispatch()
    }

    get selected() {
        return this._selected
    }

    get selectedDuringDrawing() {
        return this._selectedDuringDrawing
    }
}