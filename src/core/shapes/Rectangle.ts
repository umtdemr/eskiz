import {CanvasKit, Canvas as SkiaCanvas} from 'canvaskit-wasm';
import {Shape} from "@/core/shapes/Shape.ts";

export class Rectangle extends Shape {
    x: number
    y: number
    width: number
    height: number
    
    constructor() {
        super()
        this.x = 200
        this.y = 200
        this.width = 200
        this.height = 200
    }
    
    render(canvasKit: CanvasKit, canvas: SkiaCanvas) {
        canvas.translate(this.x, this.y)
        const paint = new canvasKit.Paint();
        paint.setColor(canvasKit.Color4f(0.9, 0, 0, 1.0));
        paint.setStyle(canvasKit.PaintStyle.Stroke);
        paint.setAntiAlias(true);
        
        const rect = canvasKit.LTRBRect(
            this.x - this.width / 2, 
            this.y - this.height / 2, 
            this.x + this.width / 2, 
            this.y + this.height / 2
        )
        
        canvas.drawRect(rect, paint)
    }
}