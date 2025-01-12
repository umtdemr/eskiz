import CanvasKitInit, {CanvasKit, Surface, Canvas as SkiaCanvas} from "canvaskit-wasm";
import {Emitter} from "@/core/emitter/Emitter.ts";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";
import {WheelEvent} from "react";

export type CanvasEventsMap = {
    'modeChange': 'neutral' | 'pan' | 'create';
    'zoom': number,
    'mouseMove': MouseEvent
}

type Point = {
    x: number
    y: number
}

type Transform = [number, number, number, number, number, number]

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
    private _slugId: string;
    
    constructor(slugId: string) {
        super()
        this._slugId = slugId;
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    private setEventHandlers() {
        this.upperCanvasEl.addEventListener('mousedown', this.onMouseDown)
        this.upperCanvasEl.addEventListener('mousemove', this.onMouseMove);
        this.upperCanvasEl.addEventListener('mouseup', this.onMouseUp);
        // @ts-ignore
        this.upperCanvasEl.addEventListener('wheel', this.onMouseWheel);
    }

    private onMouseDown(e: MouseEvent) {
        if (this._mouseMode === 'pan') {
            this._isPanning = true;
            this.startPanX = e.clientX - this.offsetX * this.scale;
            this.startPanY = e.clientY - this.offsetY * this.scale;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.upperCanvasEl.style.cursor = 'grabbing';
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (this._mouseMode === 'pan' && this._isPanning) {
            this.offsetX = (e.clientX - this.startPanX) / this.scale;
            this.offsetY = (e.clientY - this.startPanY) / this.scale;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.needsRender = true;
        }
        this.emit('mouseMove', e)
    }

    private onMouseUp() {
        if (this._isPanning) {
            this._isPanning = false;
            this.upperCanvasEl.style.cursor = 'grab';
        }
    }

    private onMouseWheel(e: WheelEvent) {
        e.preventDefault();

        // zooming should be activated with ctrl key
        if (!e.ctrlKey) {
            return
        }
        const mouseX = e.clientX
        const mouseY = e.clientY;

        const zoomFactor = e.deltaY > 0 ? 0.5 : 1.6;
        const oldScale = this.scale;
        this.scale = Math.min(Math.max(ZOOM_LEVELS.MIN, this.scale * zoomFactor), ZOOM_LEVELS.MAX);

        this.offsetX = mouseX / this.scale - mouseX / oldScale + this.offsetX;
        this.offsetY = mouseY / this.scale - mouseY / oldScale + this.offsetY;

        this.needsRender = true
        this.emit('zoom', this.scale)
    }

    private setCanvasElStyles(canvasEl: HTMLCanvasElement) {
        canvasEl.style.position = 'absolute';
        canvasEl.style.left = '0';
        canvasEl.style.top = '0';
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
        this.setEventHandlers();
        this.needsRender = true;
        
        return true
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
        const drawGrid = this.drawGrid.bind(this)

        function draw(canvas: SkiaCanvas) {
            canvas.clear(canvasKit.WHITE);
            
            
            canvas.save()
            canvas.scale(scale, scale)
            canvas.translate(offsetX, offsetY);

            drawGrid(canvas)
            
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
    
    drawGrid(canvas: SkiaCanvas) {
        const height = this.surface.height()
        const width = this.surface.width()
        const baseGridSize = 50

        // Calculate the visible area
        const visibleLeft = -this.offsetX
        const visibleTop = -this.offsetY
        const visibleRight = ((width / this.scale) - this.offsetX)
        const visibleBottom = ((height / this.scale) - this.offsetY)

        // Calculate the appropriate grid size based on current scale
        const log10Scale = Math.log10(this.scale)
        const power = Math.floor(log10Scale)
        const fraction = log10Scale - power

        // Calculate two grid sizes for smooth transition
        const gridSize1 = baseGridSize * Math.pow(10, -power);
        const gridSize2 = gridSize1 / 10;

        // Calculate base alpha that decreases as zoom increases
        const maxAlpha = 0.3;
        const zoomFactor = this.scale;
        const baseAlpha = maxAlpha / zoomFactor;

        // Calculate alpha for smooth transition
        const alpha1 = Math.min(baseAlpha, (1 - fraction) * baseAlpha)
        const alpha2 = Math.min(baseAlpha, fraction * baseAlpha)

        // Calculate line width that decreases with zoom
        const baseWidth = this.scale < 1 ? Math.min(0.6, 1 / this.scale * 2) : Math.min(0.3, 1 / this.scale * 2);

        [
            { size: gridSize1, alpha: alpha1 },
            { size: gridSize2, alpha: alpha2 }
        ].forEach(({ size, alpha }) => {
            if (alpha > 0) {
                const gridPath = new this.canvasKit.Path()
                const gridPaint = new this.canvasKit.Paint()
                gridPaint.setColor(this.canvasKit.BLACK)
                gridPaint.setStyle(this.canvasKit.PaintStyle.Stroke)
                gridPaint.setAntiAlias(true)
                gridPaint.setAlphaf(alpha)
                gridPaint.setStrokeWidth(baseWidth)

                // Calculate grid lines that cover the visible area
                const startX = Math.floor(visibleLeft / size) * size
                const endX = Math.ceil(visibleRight / size) * size
                const startY = Math.floor(visibleTop / size) * size
                const endY = Math.ceil(visibleBottom / size) * size

                // Draw horizontal lines
                for (let y = startY; y <= endY; y += size) {
                    gridPath.moveTo(startX, y)
                    gridPath.lineTo(endX, y)
                }

                // Draw vertical lines
                for (let x = startX; x <= endX; x += size) {
                    gridPath.moveTo(x, startY)
                    gridPath.lineTo(x, endY)
                }

                gridPath.close()
                canvas.drawPath(gridPath, gridPaint)
            }
        })
    }

    zoom(newZoom: number) {
        newZoom = Math.min(Math.max(ZOOM_LEVELS.MIN, newZoom), ZOOM_LEVELS.MAX)
        this.scale = newZoom
        this.needsRender = true
        this.emit('zoom', this.scale)
    }
    
    dispose() {
        this.upperCanvasEl.removeEventListener('mousedown', this.onMouseDown)
        this.upperCanvasEl.removeEventListener('mousemove', this.onMouseMove);
        this.upperCanvasEl.removeEventListener('mouseup', this.onMouseUp);
        // @ts-ignore
        this.upperCanvasEl.removeEventListener('wheel', this.onMouseWheel);
        this.clearEventListeners() // remove eventListeners in Emitter class
    }
    
    getPointer(e: MouseEvent): Point {
        const pointer = {
            x: e.x,
            y: e.y
        }

        return this.transformPoint(
            pointer,
            this.invertTransform(this.viewportTransform)
        );
    }

    transformPoint(p: Point, t: Transform, ignoreOffset?: boolean) {
        if (ignoreOffset) {
            return {
                x: t[0] * p.x + t[2] * p.y,
                y: t[1] * p.x + t[3] * p.y
            }
        }
        return {
            x: t[0] * p.x + t[2] * p.y + t[4],
            y: t[1] * p.x + t[3] * p.y + t[5]
        }
    }

    invertTransform(t: Transform) {
        let a = 1 / (t[0] * t[3] - t[1] * t[2]),
        r = [a * t[3], -a * t[1], -a * t[2], a * t[0]],
        o = this.transformPoint({ x: t[4], y: t[5] }, r, true);
        r[4] = -o.x;
        r[5] = -o.y;
        return r;
    }
    
    get viewportTransform(): Transform {
        return [this.scale, 0, 0, this.scale, this.offsetX * this.scale, this.offsetY * this.scale]
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

    get initialized() {
        return this._initialized;
    }
    
    get upperCanvas() {
        return this.upperCanvasEl;
    }

}