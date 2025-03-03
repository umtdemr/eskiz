import { Triangle } from "lucide-react";
import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { Rectangle } from "../shapes/Rectangle";
import { Shape } from "../shapes/Shape";
import { Service } from "./Service";
import { Ellipse } from "../shapes/Ellipse";

export class ShapeDrawerToolService extends Service {
    private mouseController: MouseController
    private shape: Shape|null = null
    private drawingStarted: boolean = false;
    private initialPosition: { x: number, y: number } = { x: 0, y: 0 }
    
    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController

        this.init()
    }

    init() {
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }
    
    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'crosshair'
    }

    /**
     * Starts drawing a shape based on pointer
     * @param data
     * @param engine
     */
    onMouseDown(data: CanvasMouseEvent) {
        const drawingMode = this.engine.activeMode.subMode
        this.initialPosition = {
            x: data.pointer.x,
            y: data.pointer.y,
        }

        let shapeConstructor
        if (drawingMode === 'createRectangle') {
            shapeConstructor = Rectangle
        } else if (drawingMode === 'createTriangle') {
            shapeConstructor = Triangle
        } else if (drawingMode === 'createEllipse') {
            shapeConstructor = Ellipse
        }

        if (shapeConstructor) {
            this.shape = new shapeConstructor({
                x: data.pointer.x,
                y: data.pointer.y,
                width: 1,
                height: 1,
                parentLayer: this.engine.stage.widgetsDefaultLayer
            })
            this.engine.stage.addWidget(this.shape!)
            this.drawingStarted = true;
        } 
    }

    /**
     * Handles changing width and height during shape drawing
     * @param data
     * @param engine
     */
    onMouseMove(data: CanvasMouseEvent) {
        if (!this.shape) return
        const { canvas } = data

        // change width and height
        this.shape.width = Math.abs(data.pointer.x - this.initialPosition.x)
        this.shape.height = Math.abs(data.pointer.y - this.initialPosition.y)
        
        // grow shape equally when shift key is being pressed
        if (data.e.shiftKey) {
            const maxSide = Math.max(this.shape.width, this.shape.height)
            this.shape.width = this.shape.height = maxSide
        }

        // align x and y
        if (data.pointer.x > this.initialPosition.x) {
            this.shape.left = this.initialPosition.x
        } else {
            this.shape.right = this.initialPosition.x
        }
        
        if (data.pointer.y > this.initialPosition.y) {
            this.shape.top = this.initialPosition.y
        } else {
            this.shape.bottom = this.initialPosition.y
        }
        
        canvas?.requestRender()
    }

    onMouseUp() {
        // this.engine.changeActiveMode('neutral') // todo: fix here
        this.reset()
    }
    
    reset() {
        this.shape = null
        this.drawingStarted = false
    }

    /**
     * If true, in next mouse down drawer will start drawing.
     */
    get isDrawerActive() {
        return this.drawingStarted
    }

    dispose(): void {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }
}