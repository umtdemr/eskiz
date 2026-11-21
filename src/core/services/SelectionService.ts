import { ACTION_MODES } from '@/helpers/Constant'
import { Engine } from '../engine/Engine'
import { BoundingBox } from '../geometry/BoundingBox'
import { Widget } from '../shapes/Widget'
import { Signal } from '../signal/Signal'
import { Service } from './Service'
import { MainModeChangedState, ToolService } from './ToolService'
import {
    WidgetDeletedSignal,
    WidgetLockStateChangedSignal,
    WidgetsService,
} from './WidgetsService'

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
    drawingStarted = new Signal()
    drawingFinished = new Signal()
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
        this.widgetsService.widgetLockStateChanged.add(
            this.onWidgetsLockStateChanged,
            this,
        )
    }

    private onMainModeChanged(state: MainModeChangedState) {
        // if select tool is not selected, remove selection
        if (state.tool !== ACTION_MODES.SELECT) {
            this.clearSelection()
            this.engine.canvas.requestRender()
        }
    }

    private onWidgetsDeleted(props: WidgetDeletedSignal) {
        // find if there is any deleted widget is in the selection
        const deletedInSelection: Widget[] = []
        props.widgets.forEach((widget) => {
            if (this.isWidgetInSelection(widget))
                deletedInSelection.push(widget)
        })

        if (!deletedInSelection.length) {
            return
        }

        this.removeWidgetsFromSelection(deletedInSelection)
    }

    private onWidgetsLockStateChanged(props: WidgetLockStateChangedSignal) {
        // find if there is any updated widget is in the selection
        const lockStateChangedInSelection: Widget[] = []
        props.widgets.forEach((widget) => {
            if (this.isWidgetInSelection(widget))
                lockStateChangedInSelection.push(widget)
        })

        if (!lockStateChangedInSelection.length) {
            return
        }

        this.selectionChanged.dispatch({
            type: 'updated',
            widgets: this._selected,
            updateData: {
                removedWidgets: [],
                addedWidgets: [],
            },
        })
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

    // adds the widget, or takes it out when it's already selected
    toggleWidget(widget: Widget) {
        const rest = this._selected.filter((w) => w !== widget)
        if (rest.length === this._selected.length) rest.push(widget)

        this.changeSelection(rest)
    }

    // changes the selection in place, so the ones that stay aren't deselected
    private changeSelection(widgets: Widget[]) {
        // text editing hooks into a full select of a single widget
        if (widgets.length < 2 || !this._selected.length) {
            if (widgets.length) {
                this.selectWidgets(widgets)
            } else {
                this.clearSelection()
                this.engine.canvas.requestRender()
            }
            return
        }

        const next = new Set(widgets)
        const current = new Set(this._selected)
        const removedWidgets = this._selected.filter((w) => !next.has(w))
        const addedWidgets = widgets.filter((w) => !current.has(w))

        removedWidgets.forEach((widget) => {
            widget.selected = false
            widget.deselected.dispatch()
        })
        addedWidgets.forEach((widget) => (widget.selected = true))
        this._selected = widgets

        this.selectionChanged.dispatch({
            type: 'updated',
            widgets,
            updateData: { removedWidgets, addedWidgets },
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

    checkObjectsInRect(
        rect: BoundingBox,
        options: {
            ignoreLocked: boolean
        } = {
            ignoreLocked: true,
        },
    ): Widget[] {
        const shapesLayer = this.engine.stage.widgetsDefaultLayer
        const allWidgets = new Set<Widget>()

        for (const child of shapesLayer.children) {
            if (!(child instanceof Widget) || !child.interactive) continue
            if (!child.visible || child.isDeleted) continue
            if (child.isLocked && options.ignoreLocked) continue

            if (rect.containsRect(child.bounds)) {
                allWidgets.add(child)
            } else {
                allWidgets.delete(child)
            }
        }

        return Array.from(allWidgets)
    }

    startDrawing() {
        // the preview only redraws when its size changes, start from empty
        this._selectedDuringDrawing = []
        this.drawingStarted.dispatch()
    }

    // with `add` the area joins the current selection
    selectObjectsWithDrawing(rect: BoundingBox, add = false) {
        const widgets = this.areaSelection(rect, add)
        if (widgets.length !== this._selectedDuringDrawing.length) {
            this._selectedDuringDrawing = widgets
            this.drawingSelectionUpdated.dispatch()
        }
    }

    selectRectangularArea(rect: BoundingBox, add = false) {
        const widgets = this.areaSelection(rect, add)
        if (add) {
            this.changeSelection(widgets)
        } else if (widgets.length) {
            this.selectWidgets(widgets)
        } else {
            this.clearSelection()
        }
    }

    private areaSelection(rect: BoundingBox, add: boolean) {
        const inArea = this.checkObjectsInRect(rect)
        return add ? [...new Set([...this._selected, ...inArea])] : inArea
    }

    isMultipleSelection(): boolean {
        return this._selected.length > 1
    }

    isThereLockedWidget(): boolean {
        return this._selected.some((widget) => widget.isLocked)
    }

    get selected() {
        return this._selected
    }

    get selectedDuringDrawing() {
        return this._selectedDuringDrawing
    }
}
