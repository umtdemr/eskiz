import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import { Layer } from "../stage/Layer";
import { Point } from "../canvas/Canvas";
import { Widget } from "../shapes/Widget";
import { SelectionService } from "../services/SelectionService";
import { SelectionLayer } from "../stage/SelectionLayer";

export class SelectTool implements Tool {
    private engine: Engine
    private initialPosition: { x: number, y: number } = { x: 0, y: 0 }
    private isDrawing: boolean = false
    private shapesLayer: Layer
    private selectionLayer: SelectionLayer
    private selectionService: SelectionService
    private movingObjectState: { movingShape: Widget | null, isObjectMoved: boolean, isObjectAlreadySelected: boolean  } = {
        movingShape: null,
        isObjectMoved: false,
        isObjectAlreadySelected: false
    }

    constructor(engine: Engine, selectionService: SelectionService) {
        this.engine = engine
        this.shapesLayer = this.engine.stage.widgetsDefaultLayer;
        this.selectionService = selectionService
        this.selectionLayer = this.engine.stage.nonCanvasDynamicContainer.selectionLayer;
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'default';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
        this.clearMovingObjectState()

        const movingWidget = this.checksObjectsInLayer(this.shapesLayer, data.pointer)
        if (movingWidget) {
            this.isDrawing = false
            this.movingObjectState.movingShape = movingWidget
            this.movingObjectState.isObjectAlreadySelected = !!movingWidget.selected

            if (!this.movingObjectState.isObjectAlreadySelected) {
                this.selectionService.clearSelection()
            }

            this.initialPosition = {
                x: this.movingObjectState.movingShape.left - data.pointer.x,
                y: this.movingObjectState.movingShape.top - data.pointer.y,
            }
        } else {
            this.selectionService.clearSelection()
            this.isDrawing = true
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
            multiSelector.onMouseDown(data)
            this.engine.canvas.requestRender()
        }
    }

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        if (this.movingObjectState.movingShape) {
            this.movingObjectState.movingShape.left = this.initialPosition.x + data.pointer.x
            this.movingObjectState.movingShape.top = this.initialPosition.y + data.pointer.y
            this.engine.canvas.requestRender()

            if (!this.movingObjectState.isObjectMoved) {
                this.selectionLayer.startInstantMoving(this.movingObjectState.movingShape)
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
        engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
        this.movingObjectState.movingShape = null;
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

        const clickedWidget = this.checksObjectsInLayer(this.shapesLayer, data.pointer)
        if (clickedWidget) {
            this.selectionService.selectWidget(clickedWidget, data)
        }
        this.engine.canvas.requestRender()
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
            movingShape: null,
            isObjectMoved: false,
            isObjectAlreadySelected: false
        }
    }
}