import { ACTION_MODES } from '@/helpers/Constant'
import { CanvasMouseEvent, Engine } from '../engine/Engine'
import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { Signal } from '../signal/Signal'
import { Service } from './Service'
import { MainModeChangedState, ToolService } from './ToolService'
import { WidgetsDeletedSignal, WidgetsService } from './WidgetsService'

export interface SelectionChangedProps {
    type: 'selected' | 'tempSelected' | 'selectionCleared' | 'updated'
    widgets?: Widget[]
    updateData?: {
        removedWidgets: Widget[]
        addedWidgets: Widget[]
    }
}

export class SelectionService extends Service {
    private _selected: Widget[] = []
    private _selectedDuringDrawing: Widget[] = []
    private toolService: ToolService
    private widgetsService: WidgetsService

    selectionChanged = new Signal<SelectionChangedProps>()
    tempSelected = new Signal<Widget>()
    drawingSelectionUpdated = new Signal()

    constructor(
        engine: Engine,
        toolService: ToolService,
        widgetsService: WidgetsService,
    ) {
        super(engine)
        this.toolService = toolService

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
        this.widgetsService = widgetsService
        this.widgetsService.widgetDeleted.add(this.onWidgetsDeleted, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        // if select tool is not selected, remove selection
        if (state.tool !== ACTION_MODES.SELECT) {
            this.clearSelection()
            this.engine.canvas.requestRender()
        }
    }

    private onWidgetsDeleted(props: WidgetsDeletedSignal) {
        // find if there is any deleted widget is in the selection
        const deletedInSelection: Widget[] = []
        props.widgets.forEach((widget) => {
            if (this.isWidgetInSelection(widget))
                [deletedInSelection.push(widget)]
        })

        if (!deletedInSelection.length) {
            return
        }

        this.removeWidgetsFromSelection(deletedInSelection)
    }

    private isWidgetInSelection(widget: Widget): boolean {
        if (
            this._selected.findIndex(
                (selectionWidget) => selectionWidget === widget,
            ) !== -1
        ) {
            return true
        }
        return false
    }

    private removeWidgetsFromSelection(widgets: Widget[]) {
        const removedWidgets: Widget[] = []
        for (const widget of widgets) {
            const idx = this._selected.findIndex(
                (selectionWidget) => selectionWidget === widget,
            )
            if (idx === -1) continue
            widget.selected = false
            this._selected.splice(idx, 1)
            removedWidgets.push(widget)
        }

        if (!removedWidgets.length) {
            return
        }
        this.selectionChanged.dispatch({
            type: 'updated',
            widgets: this._selected,
            updateData: {
                removedWidgets,
                addedWidgets: [],
            },
        })
    }

    selectWidget(widget: Widget) {
        this.clearSelection()

        widget.selected = true
        this._selected = [widget]
        this.selectionChanged.dispatch({
            type: 'selected',
            widgets: this._selected,
        })
        this.engine.canvas.requestRender()
    }

    selectWidgets(widgets: Widget[]) {
        if (!widgets.length) return
        this.clearSelection()

        widgets.forEach((widget: Widget) => {
            widget.selected = true
        })
        this._selected = widgets
        this.selectionChanged.dispatch({
            type: 'selected',
            widgets: this._selected,
        })
        this.engine.canvas.requestRender()
    }

    tempSelectWidget(widget: Widget) {
        this.clearSelection(false)
        this._selected = [widget]
        this.selectionChanged.dispatch({
            type: 'tempSelected',
            widgets: this._selected,
        })
        this.engine.canvas.requestRender()
    }

    clearSelection(emit = true) {
        if (!this._selected.length) return

        this._selected.forEach((widget) => {
            widget.selected = false
            widget.deselected.dispatch()
        })

        this._selected = []

        if (!emit) {
            return
        }

        this.selectionChanged.dispatch({
            type: 'selectionCleared',
        })
    }

    checkObjectsInRect(rect: BoundingBox): Widget[] {
        const shapesLayer = this.engine.stage.widgetsDefaultLayer
        const allWidgets = new Set<Widget>()

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
        this.selectionChanged.dispatch({
            type: 'selected',
            widgets: allObjects,
        })
    }

    isMultipleSelection(): boolean {
        return this._selected.length > 1
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
