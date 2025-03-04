import { ACTION_MODES } from "@/helpers/Constant";
import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { BoundingBox } from "../geometry/BoundingBox";
import { Widget } from "../shapes/Widget";
import { Signal } from "../signal/Signal";
import { Service } from "./Service";
import { MainModeChangedState, ToolService } from "./ToolService";

export class SelectionService extends Service {
    private _selected: Widget[] = []
    private _selectedDuringDrawing: Widget[] = []
    private toolService: ToolService

    selectionChanged = new Signal()
    drawingSelectionUpdated = new Signal()

    constructor(engine: Engine, toolService: ToolService) {
        super(engine)
        this.toolService = toolService

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        // if select tool is not selected, remove selection
        if (state.tool !== ACTION_MODES.SELECT) {
            this.clearSelection()
            this.engine.canvas.requestRender()
        }
    }

    selectWidget(widget: Widget) {
        widget.selected = true;
        this._selected = [widget]
        this.selectionChanged.dispatch()
        this.engine.canvas.requestRender()
    }

    clearSelection() {
        this._selected.forEach(widget => widget.selected = false)
        this._selected = []
        this.selectionChanged.dispatch()
    }

    checkObjectsInRect(rect: BoundingBox): Widget[] {
        const shapesLayer = this.engine.stage.widgetsDefaultLayer; 
        const allWidgets = new Set<Widget>();
        
        for (const child of shapesLayer.children) {
            if (!(child instanceof Widget) || !child.interactive) continue

            if (rect.containsRect(child.bounds)) {
                allWidgets.add(child)
            } else {
                allWidgets.delete(child)
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

    get bounds(): BoundingBox {
        if (!this.selected.length) {
            return BoundingBox.createIndefinite()
        }
        if (this.selected.length === 1) {
            return this.selected[0].bounds
        }
        return BoundingBox.createWithMerge(...this._selected)
    }
}