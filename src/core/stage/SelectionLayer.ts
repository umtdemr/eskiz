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

    /**
     * Handles selection changes. It is called after mouse up events - when the selection is certain.
     */
    onSelectionChanged() {
        this._selected = this.selectionService.selected
        this.handleBordersOnSelectionChange(this._selected)
    }

    /**
     * Handles temprorary selection changes.
     */
    onDrawingSelectionUpdated() {
        const selectedWidgets = this.selectionService.selectedDuringDrawing
        this.handleBordersOnSelectionChange(selectedWidgets)
    }

    startInstantMoving(widget: Widget) {
        this.addBorders([widget])
    }

    finishMoving() {
        this.clearSelection()
    }

    /**
     * Handles drawing borders for given widgets. 
     * @param widgets Widgets to draw new bounding box.
     */
    private handleBordersOnSelectionChange(widgets = this._selected) {
        this.clearSelection()
        if (!widgets.length) return;

        this.addBorders(widgets)
        if (widgets.length > 1) {
            this.drawBoundinBoxOfSelection(widgets)
        }
    }


    /**
     * Adds bounding box border for the given widgets.
     * @param widgets Widgets to take refference.
     */
    private addBorders(widgets: Widget[]) {
        for (const widget of widgets) {
            this.addChildren(
                new Border({
                    widgets: [widget],
                    parentLayer: this,
                    engine: this.engine
                })
            )
        }
    }

    /**
     * Draws inclusive bounding box for all the elements.
     * @param widgets Widgets to draw bounding box.
     */
    private drawBoundinBoxOfSelection(widgets: Widget[]) {
        this.addChildren(
            new Border({
                widgets,
                parentLayer: this,
                engine: this.engine
            })
        )
    }

    private clearSelection() {
        for (const border of this.children) {
            border.destroy()
        }
        this._children.clear()
    }
}