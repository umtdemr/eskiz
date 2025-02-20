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

    constructor(engine: Engine, selectionService: SelectionService) {
        this.engine = engine
        this.shapesLayer = this.engine.stage.widgetsDefaultLayer;
        this.selectionService = selectionService
    }

    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'default';
    }

    onMouseDown(data: CanvasMouseEvent, engine: Engine): void {
        if (this.checksObjectsInLayer(this.shapesLayer, data.pointer)) {
            this.isDrawing = false
        } else {
            this.selectionService.clearSelection()
            this.isDrawing = true
            const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
            multiSelector.onMouseDown(data)
            this.engine.canvas.requestRender()
        }
    }

    onMouseMove(data: CanvasMouseEvent, engine: Engine): void {
        const multiSelector = this.engine.stage.nonCanvasDynamicContainer.multiSelector;
        if (!multiSelector || !this.isDrawing) {
            return
        }
        multiSelector.onMouseMove(data)
        this.selectionService.selectObjectsWithDrawing(multiSelector.bounds)
        engine.canvas.requestRender()
    }

    onMouseUp(data: CanvasMouseEvent, engine: Engine): void {
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