import {Tool} from "@/core/tools/Tool.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import { Layer } from "../stage/Layer";
import { Point } from "../canvas/Canvas";
import { Widget } from "../shapes/Widget";
import { SelectionService } from "../services/SelectionService";

export class SelectTool implements Tool {
    private engine: Engine
    private initialPosition: { x: number, y: number } = { x: 0, y: 0 }
    private isDrawing: boolean = false
    private shapesLayer: Layer
    private selectionService: SelectionService
    private movingShape: Widget | null
    private isObjectMoved: boolean = false;

    constructor(engine: Engine, selectionService: SelectionService) {
        this.engine = engine
        this.shapesLayer = this.engine.stage.widgetsDefaultLayer;
        this.selectionService = selectionService
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'default';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
        this.isObjectMoved = false;
        const movingWidget = this.checksObjectsInLayer(this.shapesLayer, data.pointer)
        if (movingWidget) {
            this.isDrawing = false
            this.movingShape = movingWidget
            this.initialPosition = {
                x: this.movingShape.left - data.pointer.x,
                y: this.movingShape.top - data.pointer.y,
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
        if (this.movingShape) {
            this.movingShape.left = this.initialPosition.x + data.pointer.x
            this.movingShape.top = this.initialPosition.y + data.pointer.y
            this.engine.canvas.requestRender()
            this.isObjectMoved = true;
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
        this.movingShape = null;
        if (this.isObjectMoved) {
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
}