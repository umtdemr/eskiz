import { CanvasMouseEvent, Engine } from '../engine/Engine'
import { MouseController } from '../engine/MouseController'
import { Widget } from '../shapes/Widget'
import { Signal } from '@/core/signal/Signal'
import { Layer } from '../stage/Layer'
import { SelectionService } from './SelectionService'
import { Service } from './Service'
import { MainModeChangedState, ToolService } from './ToolService'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { Control } from '@/core/shapes/nonCanvasShapes/Control.ts'
import { CursorService } from '@/core/services/CursorService.ts'
import { DragHandler } from '@/core/controls/DragHandler'

export class SelectToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    dragHandler: DragHandler
    private isDrawing: boolean = false
    private shapesLayer: Layer
    private selectionService: SelectionService
    private controlOwned: Control | null = null
    private cursorService: CursorService
    private isStageInitated: boolean = false
    private mainMode: keyof typeof ACTION_MODES | null
    private _oldHoveredWidget: Widget | null = null
    private cursorToolName = CURSOR_OWNERS.SELECT_TOOL // to send request for changing cursor
    private isDragHandlerOwned: boolean = false
    private isObjectAlreadySelected: boolean = false
    private mouseDownWidget: Widget | null = null

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        engine.stagesInitiated.addOnce(this.onStagesInitiated, this)

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
        this.cursorService = this.engine.getService<CursorService>('cursor')
        this.dragHandler = engine.dragHandler
    }

    /**
     * Listens stages initilization signal
     */
    private onStagesInitiated() {
        this.isStageInitated = true
        this.checkInit()
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.mainMode = state.tool
        this.checkInit()
    }

    /**
     * Checks if all the necessary states are met, if it is, it calls init.
     */
    private checkInit() {
        this.reset()
        if (this.mainMode === ACTION_MODES.SELECT && this.isStageInitated) {
            this.init()
        }
    }

    init() {
        this.cursorService.setCursor(this.cursorToolName, 'default')
        this.shapesLayer = this.engine.stage.widgetsDefaultLayer
        this.selectionService = this.engine.getService('selection')

        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    onMouseDown(data: CanvasMouseEvent): void {
        this.isObjectAlreadySelected = false

        const selectionBound = this.selectionService.bounds
        this.mouseDownWidget = this.checksObjectsInLayer(data)

        // if there is control, control instance should own the mouse down, move and up events
        if (this.mouseDownWidget && this.mouseDownWidget instanceof Control) {
            this.isDrawing = false
            this.controlOwned = this.mouseDownWidget
            this.controlOwned.onMouseDown(data)
        } else if (
            selectionBound.isFinite() &&
            selectionBound.contains(data.pointer.x, data.pointer.y)
        ) {
            this.isObjectAlreadySelected = true
            this.isDrawing = false
            this.dragHandler.start(data, this.selectionService.selected)
            this.isDragHandlerOwned = true
        } else if (this.mouseDownWidget) {
            this.isDrawing = false
            this.dragHandler.start(data, [this.mouseDownWidget])
            this.isDragHandlerOwned = true

            // if there is a selection which is not this widget, clear selection
            this.isObjectAlreadySelected = !!this.mouseDownWidget.selected
            if (
                !this.isObjectAlreadySelected &&
                this.selectionService.selected?.length
            ) {
                this.selectionService.clearSelection()
            }
        } else {
            if (this.selectionService.selected?.length) {
                this.selectionService.clearSelection()
            }
            this.isDrawing = true
            const multiSelector =
                this.engine.stage.nonCanvasDynamicContainer.multiSelector
            multiSelector.onMouseDown(data)
            this.engine.canvas.requestRender()
        }
    }

    onMouseMove(data: CanvasMouseEvent): void {
        // if no object is moving and we are not drawing a selection rectangle
        if (this.controlOwned) {
            this.controlOwned.onMouseMove(data)
            return
        }

        if (!this.isDragHandlerOwned && !this.isDrawing) {
            const widget = this.checksObjectsInLayer(data)

            // fire mouse enter and mouse leave events
            if (
                this._oldHoveredWidget &&
                (!widget || this._oldHoveredWidget !== widget)
            ) {
                this._oldHoveredWidget.onMouseLeave()
                this._oldHoveredWidget = null
            }

            if (
                widget &&
                (!this._oldHoveredWidget || this._oldHoveredWidget !== widget)
            ) {
                widget.onMouseEnter()
                this._oldHoveredWidget = widget
            }

            return
        }

        if (this.isDragHandlerOwned) {
            this.dragHandler.handle(data)
            return
        }
        const multiSelector =
            this.engine.stage.nonCanvasDynamicContainer.multiSelector
        if (!multiSelector || !this.isDrawing) {
            return
        }
        multiSelector.onMouseMove(data)
        this.selectionService.selectObjectsWithDrawing(multiSelector.bounds)
        this.engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent): void {
        if (this.controlOwned) {
            this.controlOwned.onMouseUp(data)
            this.controlOwned = null
            return
        }

        let isObjectMoved = false
        if (this.isDragHandlerOwned) {
            isObjectMoved = this.dragHandler.end(data)
            this.isDragHandlerOwned = false
        }

        if (this.isDrawing) {
            this.isDrawing = false
            const multiSelector =
                this.engine.stage.nonCanvasDynamicContainer.multiSelector

            this.selectionService.selectRectangularArea(multiSelector.bounds)

            multiSelector.onMouseUp(data)
            this.engine.canvas.requestRender()
            return
        }

        if (
            !this.isObjectAlreadySelected &&
            this.mouseDownWidget &&
            !isObjectMoved
        ) {
            this.selectionService.selectWidget(this.mouseDownWidget)
        }

        // if clicked to selected single object
        if (
            this.mouseDownWidget &&
            this.selectionService.selected.length === 1 &&
            this.isObjectAlreadySelected &&
            !isObjectMoved
        ) {
            this.mouseDownWidget.clicked.dispatch({
                widget: this.mouseDownWidget,
            })
        }
    }

    checksObjectsInLayer(mouseData: CanvasMouseEvent): Widget | null {
        const searchLayers = [
            this.engine.stage.nonCanvasDynamicContainer.children.first!,
            this.engine.stage.widgetsDefaultLayer,
        ]
        const pointer = mouseData.pointer
        for (const layer of searchLayers) {
            if (layer.children.length === 0) continue
            for (const widget of layer.children) {
                if (!(widget instanceof Widget)) continue

                if (!widget.interactive) {
                    continue
                }

                if (widget.isDynamic) {
                    if (
                        widget.contains(
                            pointer.x,
                            pointer.y,
                            mouseData.canvas.zoom,
                        )
                    ) {
                        return widget
                    }
                } else {
                    if (widget.bounds.contains(pointer.x, pointer.y)) {
                        return widget
                    }
                }
            }
        }
        return null
    }

    reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    dispose(): void {
        this.reset()
    }
}
