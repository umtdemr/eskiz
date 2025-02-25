import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import { Layer } from "../stage/Layer";
import { Point } from "../canvas/Canvas";
import { Widget } from "../shapes/Widget";
import { SelectionService } from "../services/SelectionService";
import { SelectionLayer } from "../stage/SelectionLayer";

export class SelectTool implements Tool {
    private engine: Engine
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

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        if (this.movingObjectState.movingShape.length > 0) {
            const deltaX = data.pointer.x - this.movingObjectState.initialPointer.x
            const deltaY = data.pointer.y - this.movingObjectState.initialPointer.y

            this.movingObjectState.movingShape.forEach((widget, index) => {
                const initialPos = this.movingObjectState.initialWidgetPositions[index];
                widget.left = initialPos.left + deltaX;
                widget.top = initialPos.top + deltaY;
            });
    
            this.engine.canvas.requestRender();

            if (this.movingObjectState.movingShape.length === 1 && !this.movingObjectState.isObjectMoved) {
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
        engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
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
                this.selectionService.selectWidget(clickedWidget, data)
            }
            this.engine.canvas.requestRender()
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
}