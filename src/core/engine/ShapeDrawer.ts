import {Canvas, CanvasMouseEvent} from "@/core/canvas/Canvas.ts";
import {Shape} from "@/core/shapes/Shape.ts";
import {Rectangle} from "@/core/shapes/Rectangle.ts";

/**
 * Helps to draw shapes
 */
export class ShapeDrawer {
    private shape: Shape|null
    private canvas: Canvas|null
    private drawingStarted: boolean = false;
    private initialPosition: { x: number, y: number }
    
    constructor() {
    }

    /**
     * Starts drawing a shape based on pointer
     * @param e
     * @param canvas
     */
    startDrawing(e: CanvasMouseEvent, canvas: Canvas) {
        this.canvas = canvas;
        const drawingMode = this.canvas.activeMode.subMode
        if (drawingMode === 'createRectangle') {
            this.initialPosition = {
                x: e.pointer.x,
                y: e.pointer.y,
            }
            this.shape = new Rectangle({
                x: e.pointer.x,
                y: e.pointer.y,
                width: 1,
                height: 1
            })
            this.drawingStarted = true;
            this.canvas.addShape(this.shape)
        }
    }

    /**
     * Handles changing width and height during shape drawing
     * @param e
     */
    handleDrawing(e: CanvasMouseEvent) {
        if (this.shape instanceof Rectangle) {
            // change width and height
            this.shape.width = Math.abs(e.pointer.x - this.initialPosition.x)
            this.shape.height = Math.abs(e.pointer.y - this.initialPosition.y)
            
            // grow shape equally when shift key is being pressed
            if (e.e.shiftKey) {
                const maxSide = Math.max(this.shape.width, this.shape.height)
                this.shape.width = this.shape.height = maxSide
            }

            // align x and y
            if (e.pointer.x > this.initialPosition.x) {
                this.shape.left = this.initialPosition.x
            } else {
                this.shape.right = this.initialPosition.x
            }
            
            if (e.pointer.y > this.initialPosition.y) {
                this.shape.top = this.initialPosition.y
            } else {
                this.shape.bottom = this.initialPosition.y
            }
            
            this.canvas?.requestRender()
        }
    }

    stopDrawing() {
        this.reset()
    }
    
    reset() {
        this.shape = null
        this.drawingStarted = false
        this.canvas = null
    }

    /**
     * If true, in next mouse down drawer will start drawing.
     */
    get isDrawerActive() {
        return this.drawingStarted
    }

}