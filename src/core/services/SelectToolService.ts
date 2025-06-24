import { Point } from "../canvas/Canvas";
import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { Widget } from "../shapes/Widget";
import { Signal } from "@/core/signal/Signal";
import { Layer } from "../stage/Layer";
import { SelectionService } from "./SelectionService";
import { Service } from "./Service";
import { MainModeChangedState, ToolService } from "./ToolService";
import { ACTION_MODES } from "@/helpers/Constant";
import {Control} from "@/core/shapes/nonCanvasShapes/Control.ts";

export class SelectToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private isDrawing: boolean = false
    private shapesLayer: Layer
    private selectionService: SelectionService
    private controlOwned: Control | null = null;
    private movingObjectState: { 
        movingShape: Widget[]
        isObjectMoved: boolean
        isObjectAlreadySelected: boolean
        initialPointer: Point
        initialWidgetPositions: { left: number, top: number }[]
    } = {
        movingShape: [],
        isObjectMoved: false,
        isObjectAlreadySelected: false,
        initialPointer: { x: 0, y: 0 },
        initialWidgetPositions: []
    }
    private isStageInitated: boolean = false;
    private mainMode: keyof typeof ACTION_MODES | null;
    private _oldHoveredWidget: Widget | null = null;
    
    // signals for move
    moveStarted = new Signal<{ widgets: Widget[] }>()
    moveFinished = new Signal<{ widgets: Widget[] }>()

    // signals for temp move. means when the shape is moved without selecting it
    tempMoveStarted = new Signal<{ widget: Widget }>()
    tempMoveFinished = new Signal<{ widget: Widget }>()

    constructor(engine: Engine, mouseController: MouseController, toolService: ToolService) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        engine.stagesInitiated.addOnce(this.onStagesInitiated, this)

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
    }

    /**
     * Listens stages initilization signal
     */
    private onStagesInitiated() {
        this.isStageInitated = true;
        this.checkInit();
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.mainMode = state.tool;
        this.checkInit();
    }

    /**
     * Checks if all the necessary states are met, if it is, it calls init.
     */
    private checkInit() {
        this.reset();
        if (this.mainMode === ACTION_MODES.SELECT && this.isStageInitated) {
            this.init();
        }
    }

    init() {
        this.engine.upperCanvasEl.style.cursor = 'default';
        this.shapesLayer = this.engine.stage.widgetsDefaultLayer;
        this.selectionService = this.engine.getService('selection')

        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }


    onMouseDown(data: CanvasMouseEvent): void {
        this.clearMovingObjectState()

        const selectionBound = this.selectionService.bounds
        const mouseDownWidget = this.checksObjectsInLayer(data)

        // if there is control, control instance should own the mouse down, move and up events
        if (mouseDownWidget && mouseDownWidget instanceof Control) {
            this.isDrawing = false
            this.controlOwned = mouseDownWidget;
            this.controlOwned.onMouseDown(data);
        } else if (selectionBound.isFinite() && selectionBound.contains(data.pointer.x, data.pointer.y)) {
            this.isDrawing = false
            this.movingObjectState.movingShape = this.selectionService.selected
            this.movingObjectState.isObjectAlreadySelected = true

            this.movingObjectState.initialPointer = {
                x: data.pointer.x,
                y: data.pointer.y,
            }
            this.movingObjectState.initialWidgetPositions = this.movingObjectState.movingShape.map( widget => ({
                left: widget.left,
                top: widget.top,
            }))
        } else if (mouseDownWidget) {
                this.isDrawing = false
                this.movingObjectState.movingShape = [mouseDownWidget]
                this.movingObjectState.isObjectAlreadySelected = !!mouseDownWidget.selected
    
                if (!this.movingObjectState.isObjectAlreadySelected) {
                    this.selectionService.clearSelection()
                }
    
                this.movingObjectState.initialPointer = {
                    x: data.pointer.x,
                    y: data.pointer.y,
                }
                this.movingObjectState.initialWidgetPositions = [{ left: mouseDownWidget.left, top: mouseDownWidget.top }]
        } else {
            this.selectionService.clearSelection()
            this.isDrawing = true
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
            multiSelector.onMouseDown(data)
            this.engine.canvas.requestRender()
        }
    }

    onMouseMove(data: CanvasMouseEvent): void {
        // if no object is moving and we are not drawing a selection rectangle
        if (this.controlOwned) {
            this.controlOwned.onMouseMove(data);
            return;
        }

        if (!this.movingObjectState.movingShape.length && !this.isDrawing) {
            const widget = this.checksObjectsInLayer(data)

            // fire mouse enter and mouse leave events
            if (this._oldHoveredWidget && (!widget || this._oldHoveredWidget !== widget)) {
                this._oldHoveredWidget.onMouseLeave();
                this._oldHoveredWidget = null;
            } 

            if (widget && (!this._oldHoveredWidget || this._oldHoveredWidget !== widget))  {
                widget.onMouseEnter()
                this._oldHoveredWidget = widget;
            }

            return
        }

        if (this.movingObjectState.movingShape.length > 0) {
            const deltaX = data.pointer.x - this.movingObjectState.initialPointer.x
            const deltaY = data.pointer.y - this.movingObjectState.initialPointer.y

            this.movingObjectState.movingShape.forEach((widget, index) => {
                const initialPos = this.movingObjectState.initialWidgetPositions[index];
                widget.left = initialPos.left + deltaX;
                widget.top = initialPos.top + deltaY;
            });
    
            this.engine.canvas.requestRender();

            if (this.movingObjectState.movingShape.length === 1 && !this.movingObjectState.isObjectMoved && !this.movingObjectState.isObjectAlreadySelected) {
                this.tempMoveStarted.dispatch({ widget :this.movingObjectState.movingShape[0] })
            }
            
            // if selected object is moved, dispatch moveStarted
            if (this.movingObjectState.movingShape.length > 0 && !this.movingObjectState.isObjectMoved && this.movingObjectState.isObjectAlreadySelected){
                this.moveStarted.dispatch({ widgets: this.movingObjectState.movingShape });
            }

            this.movingObjectState.isObjectMoved = true;
            return
        }
        const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
        if (!multiSelector || !this.isDrawing) {
            return
        }
        multiSelector.onMouseMove(data)
        this.selectionService.selectObjectsWithDrawing(multiSelector.bounds)
        this.engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent): void {
        if (this.controlOwned) {
            this.controlOwned.onMouseUp(data);
            this.controlOwned = null;
            return
        }
        if (this.movingObjectState.isObjectMoved && !this.movingObjectState.isObjectAlreadySelected) {
            this.tempMoveFinished.dispatch({ widget: this.movingObjectState.movingShape[0] })
            this.engine.canvas.requestRender()
            this.movingObjectState.movingShape = [];
            return
        } else if (this.movingObjectState.isObjectMoved) {
            // if selected object is moved, dispatch moveFinished
            this.moveFinished.dispatch({ widgets: this.movingObjectState.movingShape })
        }
        this.movingObjectState.movingShape = [];

        if (this.isDrawing) {
            this.isDrawing = false;
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;

            this.selectionService.selectRectangularArea(multiSelector.bounds)

            multiSelector.onMouseUp(data)
            this.engine.canvas.requestRender()
            return
        }

        if (!this.movingObjectState.isObjectAlreadySelected) {
            const clickedWidget = this.checksObjectsInLayer(data)
            if (clickedWidget) {
                this.selectionService.selectWidget(clickedWidget)
            }
        }
    }

    checksObjectsInLayer(mouseData: CanvasMouseEvent): Widget | null {
        const searchLayers = [this.engine.stage.nonCanvasDynamicContainer.children.first!, this.engine.stage.widgetsDefaultLayer]
        const pointer = mouseData.pointer;
        for (const layer of searchLayers) {
            if (layer.children.length === 0) continue
            for (const widget of layer.children) {
                if (!(widget instanceof Widget)) continue

                if (!widget.interactive) {
                    continue
                }

                if (widget.isDynamic) {
                    if (widget.contains(pointer.x, pointer.y, mouseData.canvas.zoom)) {
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

    private clearMovingObjectState() {
        this.movingObjectState = {
            movingShape: [],
            isObjectMoved: false,
            isObjectAlreadySelected: false,
            initialPointer: { x: 0, y: 0 },
            initialWidgetPositions: []
        }
    }

    reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    dispose(): void {
        this.reset();
    }
}