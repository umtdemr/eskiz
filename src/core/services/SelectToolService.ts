import { Point } from "../canvas/Canvas";
import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { Widget } from "../shapes/Widget";
import { Layer } from "../stage/Layer";
import { SelectionLayer } from "../stage/SelectionLayer";
import { SelectionService } from "./SelectionService";
import { Service } from "./Service";
import { MainModeChangedState, ToolService } from "./ToolService";
import { ACTION_MODES } from "@/helpers/Constant";

export class SelectToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private isDrawing: boolean = false
    private shapesLayer: Layer
    private selectionLayer: SelectionLayer
    private selectionService: SelectionService
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
        this.selectionLayer = this.engine.stage.nonCanvasDynamicContainer.selectionLayer;

        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }


    onMouseDown(data: CanvasMouseEvent): void {
        this.clearMovingObjectState()

        const selectionBound = this.selectionService.bounds
        const movingWidget = this.checksObjectsInLayer(this.shapesLayer, data.pointer)

        if (selectionBound.isFinite() && selectionBound.contains(data.pointer.x, data.pointer.y)) {
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
        } else if (movingWidget) {
                this.isDrawing = false
                this.movingObjectState.movingShape = [movingWidget]
                this.movingObjectState.isObjectAlreadySelected = !!movingWidget.selected
    
                if (!this.movingObjectState.isObjectAlreadySelected) {
                    this.selectionService.clearSelection()
                }
    
                this.movingObjectState.initialPointer = {
                    x: data.pointer.x,
                    y: data.pointer.y,
                }
                this.movingObjectState.initialWidgetPositions = [{ left: movingWidget.left, top: movingWidget.top }]
        } else {
            this.selectionService.clearSelection()
            this.isDrawing = true
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
            multiSelector.onMouseDown(data)
            this.engine.canvas.requestRender()
        }
    }

    onMouseMove(data: CanvasMouseEvent): void {
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
                this.selectionLayer.startInstantMoving(this.movingObjectState.movingShape[0])
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
        this.movingObjectState.movingShape = [];
        if (this.movingObjectState.isObjectMoved && !this.movingObjectState.isObjectAlreadySelected) {
            this.selectionLayer.finishMoving()
            this.engine.canvas.requestRender()
            return
        }

        if (this.isDrawing) {
            this.isDrawing = false;
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;

            this.selectionService.selectRectangularArea(multiSelector.bounds)

            multiSelector.onMouseUp(data)
            this.engine.canvas.requestRender()
            return
        }

        if (!this.movingObjectState.isObjectAlreadySelected) {
            const clickedWidget = this.checksObjectsInLayer(this.shapesLayer, data.pointer)
            if (clickedWidget) {
                this.selectionService.selectWidget(clickedWidget)
            }
        }
    }

    checksObjectsInLayer(layer: Layer, pointer: Point): Widget | null {
        for (const widget of layer.children) {
            if (!(widget instanceof Widget)) continue

            if (widget.bounds.contains(pointer.x, pointer.y)) {
                return widget
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