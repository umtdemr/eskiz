import { Engine } from "../engine/Engine";
import { SelectionService } from "../services/SelectionService";
import { SelectToolService } from "@/core/services/SelectToolService";
import { Border } from "../shapes/nonCanvasShapes/Border";
import { Widget } from "../shapes/Widget";
import { Layer } from "./Layer";
import {Control, ControlPosition} from "@/core/shapes/nonCanvasShapes/Control.ts";

export class SelectionLayer extends Layer {
    private engine: Engine
    private selectionService: SelectionService
    private _selected: Widget[]
    private selectionBorder: Border | null = null;
    private controls: Control[] = [];
    private selectToolService: SelectToolService;

    constructor(engine: Engine, selectionService: SelectionService) {
        super({ name: 'selection_layer' })
        this.engine = engine;
        this.selectionService = selectionService

        this.selectionService.selectionChanged.add(this.onSelectionChanged, this)
        this.selectionService.drawingSelectionUpdated.add(this.onDrawingSelectionUpdated, this)

        this.selectToolService = this.engine.getService<SelectToolService>('selectTool');
        this.selectToolService.moveStarted.add(this.onMoveStarted, this);
        this.selectToolService.moveFinished.add(this.onMoveFinished, this);
        this.selectToolService.tempMoveStarted.add(this.onTempMoveStarted, this);
        this.selectToolService.tempMoveFinished.add(this.onTempMoveFinished, this);
    }

    /**
     * Handles selection changes. It is called after mouse up events - when the selection is certain.
     */
    onSelectionChanged() {
        this._selected = this.selectionService.selected
        this.createSelectionUI(this._selected);
    }

    /**
     * Handles temprorary selection changes.
     */
    onDrawingSelectionUpdated() {
        const selectedWidgets = this.selectionService.selectedDuringDrawing
        this.handleBordersOnSelectionChange(selectedWidgets)
    }

    finishMoving() {
        this.clearSelection()
    }

    onMoveStarted() {
        this.hideControls()
    }

    onMoveFinished() {
        this.showControls()
        this.updateControlPositions()
        this.engine.canvas.requestRender()
    }

    onTempMoveStarted({ widget }: { widget: Widget }) {
        this.addBorders([widget])
    }

    onTempMoveFinished() {
        this.clearSelection();
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

    private createSelectionUI(widgets: Widget[]) {
        this.clearSelection()
        if (!widgets.length) return;

        this.addBorders(widgets)
        // todo: listens selection border bounds change
        if (widgets.length > 1) {
            this.selectionBorder = this.drawBoundinBoxOfSelection(widgets)
        } else {
            this.selectionBorder = this.children.first! as Border
        }

        const handlePositions = [
            ControlPosition.TOP_LEFT,
            ControlPosition.TOP_RIGHT,
            ControlPosition.BOTTOM_LEFT,
            ControlPosition.BOTTOM_RIGHT,
        ]

        for (const position of handlePositions) {
            const handle = new Control(
                {
                    position,
                    x: 0,
                    y: 0,
                    selectionLayer: this
                },
                this.engine,
                this.selectionService,
            )

            this.controls.push(handle);
            this.addChildren(handle);
        }

        this.updateControlPositions();
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
        const border = new Border({
            widgets,
            parentLayer: this,
            engine: this.engine
        })
        this.addChildren(border)
        return border;
    }

    private clearSelection() {
        for (const border of this.children) {
            border.destroy()
        }
        this._children.clear()
        this.controls.length = 0;
    }

    private updateControlPositions() {
        const box = this.selectionBorder!
        for (const control of this.controls) {
            switch (control.position) {
                case ControlPosition.TOP_LEFT:
                    control.left = box.left;
                    control.top = box.top;
                    break;
                case ControlPosition.TOP_RIGHT:
                    control.left = box.right;
                    control.top = box.top;
                    break;
                case ControlPosition.BOTTOM_LEFT:
                    control.left = box.left;
                    control.top = box.bottom;
                    break;
                case ControlPosition.BOTTOM_RIGHT:
                    control.left = box.right;
                    control.top = box.bottom;
                    break;
            }
        }
    }

    private changeControlsVisibility(visible: boolean) {
        this.controls.forEach(control => {
            control.visible = visible;
        })
    }

    private hideControls() {
        this.changeControlsVisibility(false);
    }
    private showControls() {
        this.changeControlsVisibility(true);
    }
}