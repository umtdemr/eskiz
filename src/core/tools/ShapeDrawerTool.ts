import {Shape} from "@/core/shapes/Shape.ts";
import {Rectangle} from "@/core/shapes/Rectangle.ts";
import {Triangle} from "@/core/shapes/Triangle.ts";
import {Ellipse} from "@/core/shapes/Ellipse.ts";
import {Engine, CanvasMouseEvent} from "@/core/engine/Engine.ts";
import {Tool} from "@/core/tools/Tool.ts";

/**
 * Helps to draw shapes
 */
export class ShapeDrawerTool implements Tool {
    private shape: Shape|null
    private drawingStarted: boolean = false;
    private initialPosition: { x: number, y: number }
    
    constructor() {
    }
    
    onActivate(engine: Engine) {
        engine.upperCanvasEl.style.cursor = 'crosshair'
    }

    /**
     * Starts drawing a shape based on pointer
     * @param data
     * @param engine
     */
    onMouseDown(data: CanvasMouseEvent, engine: Engine) {
        const { canvas } = data
        const drawingMode = engine.activeMode.subMode
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
            })
            canvas.addWidget(this.shape!)
            this.drawingStarted = true;
        } 
    }

    /**
     * Handles changing width and height during shape drawing
     * @param data
     * @param engine
     */
    onMouseMove(data: CanvasMouseEvent, engine: Engine) {
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

    onMouseUp(data: CanvasMouseEvent, engine: Engine) {
        engine.changeActiveMode('neutral')
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

}