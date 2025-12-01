import { Engine } from '../engine/Engine'
import {
    SelectionChangedProps,
    SelectionService,
} from '@/core/services/SelectionService'
import { SelectToolService } from '@/core/services/SelectToolService'
import { Border } from '../shapes/nonCanvasShapes/Border'
import { Widget } from '../shapes/Widget'
import { Layer } from './Layer'
import { Control } from '@/core/shapes/nonCanvasShapes/Control.ts'
import {
    CornerControl,
    CornerPosition,
} from '@/core/shapes/nonCanvasShapes/CornerControl.ts'
import {
    EdgeControl,
    EdgePosition,
} from '@/core/shapes/nonCanvasShapes/EdgeControl.ts'
import { DragHandler } from '../controls/DragHandler'

export class SelectionLayer extends Layer {
    private engine: Engine
    private selectionService: SelectionService
    private _selected: Widget[]
    private _selectionBorder: Border | null = null
    private controls: Control[] = []
    private selectToolService: SelectToolService
    private dragHandler: DragHandler

    constructor(engine: Engine, selectionService: SelectionService) {
        super({ name: 'selection_layer' })
        this.engine = engine
        this.dragHandler = engine.dragHandler
        this.selectionService = selectionService

        this.selectionService.selectionChanged.add(
            this.onSelectionChanged,
            this,
        )
        this.selectionService.drawingSelectionUpdated.add(
            this.onDrawingSelectionUpdated,
            this,
        )

        this.selectToolService =
            this.engine.getService<SelectToolService>('selectTool')
        this.dragHandler.moveStarted.add(this.onMoveStarted, this)
        this.dragHandler.moveFinished.add(this.onMoveFinished, this)
        this.dragHandler.tempMoveStarted.add(this.onTempMoveStarted, this)
        this.dragHandler.tempMoveFinished.add(this.onTempMoveFinished, this)
    }

    /**
     * Handles selection changes. It is called after mouse up events - when the selection is certain.
     */
    onSelectionChanged(props: SelectionChangedProps) {
        switch (props.type) {
            case 'selected':
                this._selected = props.widgets || []
                this.createSelectionUI(this._selected)
                break
            case 'tempSelected':
                this._selected = []
                this.addBorders(props.widgets!)
                break
            case 'updated':
                this.clearSelection()
                this._selected = props.widgets || []
                this.createSelectionUI(this._selected)
                break
            case 'selectionCleared':
                this._selected = []
                this.clearSelection()
        }
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
        this.engine.canvas.requestRender()
    }

    onTempMoveStarted({ widget }: { widget: Widget }) {
        this.addBorders([widget])
    }

    onTempMoveFinished() {
        this.clearSelection()
    }

    tempAddBorder(widget: Widget) {
        // if there is any selection,,
        this.clearSelection()

        this.addBorders([widget])
    }

    /**
     * Handles drawing borders for given widgets.
     * @param widgets Widgets to draw new bounding box.
     */
    private handleBordersOnSelectionChange(widgets = this._selected) {
        this.clearSelection()
        if (!widgets.length) return

        this.addBorders(widgets)
        if (widgets.length > 1) {
            this.drawBoundinBoxOfSelection(widgets)
        }
    }

    private createSelectionUI(widgets: Widget[]) {
        this.clearSelection()
        if (!widgets.length) return

        this.addBorders(widgets)
        // todo: listens selection border bounds change
        if (widgets.length > 1) {
            this._selectionBorder = this.drawBoundinBoxOfSelection(widgets)
        } else {
            this._selectionBorder = this.children.first! as Border
        }

        // don't add controls for multiple selection as of now
        if (widgets.length > 1) {
            return
        }

        // do not show controls for path
        // TODO: need to find a better way to control this.
        if (widgets[0].widgetType === 'path') {
            return
        }
        if (widgets[0].isLocked) {
            return
        }

        // add controls
        const edgeControls = [
            EdgePosition.LEFT,
            EdgePosition.RIGHT,
            EdgePosition.TOP,
            EdgePosition.BOTTOM,
        ]
        const cornerControls = [
            CornerPosition.TOP_LEFT,
            CornerPosition.TOP_RIGHT,
            CornerPosition.BOTTOM_LEFT,
            CornerPosition.BOTTOM_RIGHT,
        ]

        // TODO: fix order of controls when I fix the widget searching algo
        for (const position of cornerControls) {
            const handle = new CornerControl(
                {
                    position,
                    x: 0,
                    y: 0,
                    selectionLayer: this,
                },
                this.engine,
                this.selectionService,
            )

            this.controls.push(handle)
            this.addChildren(handle)
        }

        for (const position of edgeControls) {
            const handle = new EdgeControl(
                {
                    position,
                    x: 0,
                    y: 0,
                    selectionLayer: this,
                },
                this.engine,
                this.selectionService,
            )

            this.controls.push(handle)
            this.addChildren(handle)
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
                    engine: this.engine,
                }),
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
            engine: this.engine,
        })
        this.addChildren(border)
        return border
    }

    private clearSelection() {
        for (const widget of this.children) {
            widget.destroy()
        }
        this._children.clear()
        this.controls.length = 0
        this._selectionBorder = null
    }

    private changeControlsVisibility(visible: boolean) {
        this.controls.forEach((control) => {
            control.visible = visible
        })
    }

    private hideControls() {
        this.changeControlsVisibility(false)
    }
    private showControls() {
        this.changeControlsVisibility(true)
    }

    get selectionBorder(): Border | null {
        return this._selectionBorder
    }
}
