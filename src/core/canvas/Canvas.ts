import CanvasKitInit, {CanvasKit, Surface, Canvas as SkiaCanvas} from "canvaskit-wasm";
import {Emitter} from "@/core/emitter/Emitter.ts";

export type CanvasEventsMap = {
    'modeChange': 'neutral' | 'pan' | 'create';
}

export class Canvas extends Emitter<CanvasEventsMap> {
    private _initialized: boolean = false;
    private canvasKit: CanvasKit;
    private surface: Surface
    private canvasEl: HTMLCanvasElement
    private upperCanvasEl: HTMLCanvasElement
    private _isPanning = false;
    private startPanX = 0;
    private startPanY = 0;
    private offsetX = 0;
    private offsetY = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private needsRender = false;
    private scale = 1;
    private _mouseMode: 'neutral' | 'pan' | 'create' = 'neutral';
    
    constructor() {
        super()
    }
    
    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement;
        if (!canvas) {
            return false;
        }
        this.canvasEl = canvas
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // create upper canvas
        const upperCanvasEl = document.createElement('canvas')
        upperCanvasEl.width = canvas.width;
        upperCanvasEl.height = canvas.height;
        upperCanvasEl.id = 'upperCanvas'
        
        canvas.parentNode.appendChild(upperCanvasEl)
        this.upperCanvasEl = upperCanvasEl;
        
        // set canvas styles
        this.setCanvasElStyles(this.canvasEl);
        this.setCanvasElStyles(this.upperCanvasEl);

        // initialize canvasKit
        this.canvasKit = await CanvasKitInit({
            locateFile: (file: string) => '/node_modules/canvaskit-wasm/bin/' + file
        })
        
        this.surface = this.canvasKit.MakeWebGLCanvasSurface(canvas)!
        this._initialized = true;
        
        // set event handlers
        this.setEventHandlers(this.upperCanvasEl);
        this.needsRender = true;
        
        return true
    }
    
    get initialized() {
        return this._initialized;
    }
    
    setCanvasElStyles(canvasEl: HTMLCanvasElement) {
        canvasEl.style.position = 'absolute';
        canvasEl.style.left = '0';
        canvasEl.style.top = '0';
    }
    
    render() {
        const paint = new this.canvasKit.Paint();
        paint.setColor(this.canvasKit.Color4f(0.9, 0, 0, 1.0));
        paint.setStyle(this.canvasKit.PaintStyle.Stroke);
        paint.setAntiAlias(true);

        const path = new this.canvasKit.Path()
        path.moveTo(100, 200)
        path.lineTo(150, 200)
        path.quadTo(300, 300, 350, 400)
        path.close()

        const canvasKit = this.canvasKit;
        const rect = this.canvasKit.LTRBRect(100, 200, 350, 400)

        const offsetX = this.offsetX;
        const offsetY = this.offsetY;


        const surface = this.surface;
        const scale = this.scale;

        function draw(canvas: SkiaCanvas) {
            canvas.clear(canvasKit.WHITE);
            
            const gridPath = new canvasKit.Path()
            const gridPaint = new canvasKit.Paint()
            gridPaint.setColor(canvasKit.BLACK)
            gridPaint.setStyle(canvasKit.PaintStyle.Stroke)
            gridPaint.setAntiAlias(true);
            gridPaint.setAlphaf(0.5)
            gridPaint.setStrokeWidth(0.2)
            
            const gridSize = 50;
            const height = surface.height()
            const width = surface.width()
            gridPath.moveTo(0, 0)
            for (let y = 0; y <= height ; y += gridSize) {
                gridPath.moveTo(0, y)
                gridPath.lineTo(width, y)
            }
            gridPath.close()
            gridPath.moveTo(0, 0)

            for (let x = 0; x <= width ; x += gridSize) {
                gridPath.moveTo(x, 0)
                gridPath.lineTo(x, height)
            }
            
            canvas.drawPath(gridPath, gridPaint)
            canvas.save()
            canvas.scale(scale, scale)
            canvas.translate(offsetX, offsetY);
            canvas.drawRect(rect, paint);
            canvas.rotate(20, 0, 0)
            canvas.drawPath(path, paint)
            canvas.restore()
        }
        surface.requestAnimationFrame(draw)
    }
    
    draw() {
        if (this.needsRender) {
            this.render()
            this.needsRender = false;
            window.requestAnimationFrame(this.draw.bind(this));
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }
    
    setEventHandlers(canvasEl: HTMLCanvasElement) {
        canvasEl.addEventListener('mousedown', (e: MouseEvent) => {
            if (this._mouseMode === 'pan') {
                this._isPanning = true;
                this.startPanX = e.clientX - this.offsetX * this.scale;
                this.startPanY = e.clientY - this.offsetY * this.scale;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                canvasEl.style.cursor = 'grabbing';
            }
        });

        canvasEl.addEventListener('mousemove', (e: MouseEvent) => {
            if (this._mouseMode === 'pan' && this._isPanning) {
                this.offsetX = (e.clientX - this.startPanX) / this.scale;
                this.offsetY = (e.clientY - this.startPanY) / this.scale;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.needsRender = true;
            }
        });

        canvasEl.addEventListener('mouseup', () => {
            if (this._isPanning) {
                this._isPanning = false;
                canvasEl.style.cursor = 'grab';
            }
        });
        
        canvasEl.addEventListener('mousewheel', (e: WheelEvent) => {
            e.preventDefault();
            
            // zooming should be activated with ctrl key
            if (!e.ctrlKey) {
                return
            }
            const mouseX = e.clientX
            const mouseY = e.clientY;

            const zoomFactor = e.deltaY > 0 ? 0.5 : 1.6;
            const oldScale = this.scale;
            this.scale = Math.min(Math.max(0.1, this.scale * zoomFactor), 10.0);

            this.offsetX = mouseX / this.scale - mouseX / oldScale + this.offsetX;
            this.offsetY = mouseY / this.scale - mouseY / oldScale + this.offsetY;
            
            this.needsRender = true
        })
    }
    
    get mouseMode() {
        return this._mouseMode
    }
    set mouseMode(newMode: 'neutral' | 'pan' | 'create') {
        const shouldEmit = newMode !== this._mouseMode
        this._mouseMode = newMode;
        if (shouldEmit) {
            this.emit('modeChange', newMode)
        }
        
        if (this.mouseMode === 'neutral') {
            this.upperCanvasEl.style.cursor = 'default'
        }
    }

}