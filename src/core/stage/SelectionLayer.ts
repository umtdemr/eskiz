import { Engine } from "../engine/Engine";
import { SelectionService } from "../services/SelectionService";
import { Border } from "../shapes/nonCanvasShapes/Border";
import { Widget } from "../shapes/Widget";
import { Layer } from "./Layer";

export class SelectionLayer extends Layer {
    private engine: Engine
    private selectionService: SelectionService
    private _selected: Widget[]

    constructor(engine: Engine, selectionService: SelectionService) {
        super({ name: 'selection_layer' })
        this.engine = engine;
        this.selectionService = selectionService

        this.selectionService.selectionChanged.add(this.onSelectionChanged, this)
        this.selectionService.drawingSelectionUpdated.add(this.onDrawingSelectionUpdated, this)
    }

    onSelectionChanged() {
        this.clearSelection()
        const newSelectedObjects = this.selectionService.selected

        this.addBorders(newSelectedObjects)
    }

    onDrawingSelectionUpdated() {
        this.clearSelection()
        const newSelectedObjects = this.selectionService.selectedDuringDrawing
        this.addBorders(newSelectedObjects)
    }

    private addBorders(widgets: Widget[]) {
        for (const widget of widgets) {
            this.addChildren(
                new Border({
                    x: widget.left,
                    y: widget.top,
                    width: widget.width,
                    height: widget.height,
                    parentLayer: this
                })
            )
        }
    }

    private clearSelection() {
        this._children.clear()
    }
}