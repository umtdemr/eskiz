import CanvasKitInit, {CanvasKit, Surface, Canvas as SkiaCanvas, FontMgr} from "canvaskit-wasm";
import {Emitter} from "@/core/emitter/Emitter.ts";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";
import {WheelEvent} from "react";
import {Rectangle} from "@/core/shapes/Rectangle.ts";
import {Widget} from "@/core/shapes/Widget.ts";

export type CanvasMainModes = 'neutral' | 'pan' | 'create'

// can be used determining sub modes for main modes. For example, main mode can be `create` and sub mode can be `createRectangle`
export type CanvasSubModes = 'createRectangle' | 'createTriangle' | 'createEllipse'

export type CanvasMode = {
    mainMode: CanvasMainModes,
    subMode?: CanvasSubModes
}

export type CanvasEventsMap = {
    'modeChange': CanvasMode
    'zoom': number,
    'mouseDown': CanvasMouseEvent
    'mouseMove': CanvasMouseEvent
    'mouseUp': CanvasMouseEvent
}

export type CanvasMouseEvent = {
    e: MouseEvent
    pointer: Point
    canvas: Canvas
}

type Point = {
    x: number
    y: number
}

type Transform = [number, number, number, number, number, number]

export class Canvas extends Emitter<CanvasEventsMap> {
    private _initialized: boolean = false;
    private surface: Surface
    private canvasEl: HTMLCanvasElement
    private upperCanvasEl: HTMLCanvasElement
    private offsetX = 0;
    private offsetY = 0;

    private needsRender = false;
    private scale = 1;
    private _activeMode: CanvasMode = { mainMode: 'neutral' };
    private _slugId: string;
    
    private _widgets: Widget[] = []
    private _selectedWidget: Widget | null
    
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
        this.emit('mouseDown', { e, pointer: this.getPointer(e), canvas: this })
    }

    private onMouseMove(e: MouseEvent) {
        this.emit('mouseMove', { e, pointer: this.getPointer(e), canvas: this })
    }

    private onMouseUp(e: MouseEvent) {
        this.emit('mouseUp', { e, pointer: this.getPointer(e), canvas: this })
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

        this.surface = canvasKit.MakeWebGLCanvasSurface(canvas)!
        
        this._initialized = true;
        
        // set event handlers
        this.setEventHandlers();
        this.needsRender = true;
        
        return true
    }
    
    render() {
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;
        const surface = this.surface;
        const scale = this.scale;
        const drawGrid = this.drawGrid.bind(this)

        const allWidgets = this._widgets
        
        const thisCall = this
        function draw(ctx: SkiaCanvas) {
            ctx.clear(canvasKit.WHITE);

            ctx.save()
            ctx.scale(scale, scale)
            ctx.translate(offsetX, offsetY);

            drawGrid(ctx)
            
            for (const widget of allWidgets) {
                ctx.save()
                widget.render(canvasKit, ctx)
                ctx.restore()
            }

            thisCall.renderControlsUI(ctx)
            ctx.restore()
        }
        surface.requestAnimationFrame(draw)
    }
    
    renderControlsUI(ctx: SkiaCanvas) {
        if (!this.selectedWidget) {
            return
        }
        if (this.selectedWidget instanceof Rectangle) {
            this.selectedWidget.renderControls(canvasKit, ctx, this.scale)
        }
    }

    requestRender() {
        this.needsRender = true;
    }
    
    draw() {
        if (this.needsRender) {
            this.render()
            this.needsRender = false;
            window.requestAnimationFrame(this.draw.bind(this));
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }
    
    drawGrid(ctx: SkiaCanvas) {
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
                const gridPath = new canvasKit.Path()
                const gridPaint = new canvasKit.Paint()
                gridPaint.setColor(canvasKit.BLACK)
                gridPaint.setStyle(canvasKit.PaintStyle.Stroke)
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
                ctx.drawPath(gridPath, gridPaint)
            }
        })
    }

    dispose() {
        this.upperCanvasEl.removeEventListener('mousedown', this.onMouseDown)
        this.upperCanvasEl.removeEventListener('mousemove', this.onMouseMove);
        this.upperCanvasEl.removeEventListener('mouseup', this.onMouseUp);
        // @ts-ignore
        this.upperCanvasEl.removeEventListener('wheel', this.onMouseWheel);
        this.clearEventListeners() // remove eventListeners in Emitter class
    }

    /**
     * Sets new mode for canvas.
     * @param newMainMode - New main mode.
     * @param newSubMode - New sub mode.
     */
    changeActiveMode(newMainMode: CanvasMainModes, newSubMode?: CanvasSubModes) {
        const shouldEmit = newMainMode !== this._activeMode.mainMode || newSubMode !== this._activeMode.subMode
        this._activeMode = {
            mainMode: newMainMode,
            subMode: newSubMode
        };
        if (shouldEmit) {
            this.emit('modeChange', { mainMode: newMainMode, subMode: newSubMode })
        }

        if (this._activeMode.mainMode === 'neutral') {
            this.upperCanvasEl.style.cursor = 'default'
        }
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
    
    addWidget(widget: Widget) {
        this._widgets.push(widget)
        this.requestRender()
    }

    get viewportTransform(): Transform {
        return [this.scale, 0, 0, this.scale, this.offsetX * this.scale, this.offsetY * this.scale]
    }
    get activeMode() {
        return this._activeMode
    }

    get initialized() {
        return this._initialized;
    }
    
    get upperCanvas() {
        return this.upperCanvasEl;
    }
    
    get zoom() {
        return this.scale
    }
    
    get translateX() {
        return this.offsetX
    }
    
    set translateX(x: number) {
        this.offsetX = x;
    }
    
    get translateY() {
        return this.offsetY
    }

    set translateY(y: number) {
        this.offsetY = y;
    }

    set zoom(newZoom: number) {
        newZoom = Math.min(Math.max(ZOOM_LEVELS.MIN, newZoom), ZOOM_LEVELS.MAX)
        this.scale = newZoom
        this.needsRender = true
        this.emit('zoom', this.scale)
    }
    
    get selectedWidget(): Widget|null {
        return this._selectedWidget
    }
    set selectedWidget(widget: Widget) {
        this._selectedWidget = widget
    }

}

export class CanvasKitSingleton {
    private static instance: CanvasKit;

    private constructor() {}

    public static async getInstance(): Promise<CanvasKit> {
        if (!CanvasKitSingleton.instance) {
            CanvasKitSingleton.instance = await CanvasKitInit({
                locateFile: (file: string) => '/node_modules/canvaskit-wasm/bin/' + file
            });
        }
        return CanvasKitSingleton.instance;
    }
}

export const canvasKit = await CanvasKitSingleton.getInstance();

export class FontManagerSingleton {
    private static instance: FontMgr;

    private constructor() {}

    public static async getInstance(canvasKit: CanvasKit): Promise<FontMgr> {
        if (!FontManagerSingleton.instance) {
            const fontUrl = '/fonts/OpenSans-Regular.ttf';
            const loadFontPromise = await fetch(fontUrl);
            FontManagerSingleton.instance = canvasKit.FontMgr.FromData(await loadFontPromise.arrayBuffer())!;
        }
        return FontManagerSingleton.instance;
    }
}

export const fontManager = await FontManagerSingleton.getInstance(canvasKit);