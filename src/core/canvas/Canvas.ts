import CanvasKitInit, {CanvasKit, Surface, Canvas as SkiaCanvas, FontMgr} from "canvaskit-wasm";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";
import {Rectangle} from "@/core/shapes/Rectangle.ts";
import {Widget} from "@/core/shapes/Widget.ts";
import { Stage } from "../stage/Stage";
import { Signal } from "../signal/Signal";

export type Point = {
    x: number
    y: number
}

type Transform = [number, number, number, number, number, number]

export type RenderContext = {
    ctx: SkiaCanvas
    scale: number
}

export const setCanvasStyles = (canvasEl: HTMLCanvasElement) => {
    canvasEl.style.position = 'absolute';
    canvasEl.style.left = '0';
    canvasEl.style.top = '0'; 
}

export class Canvas {
    private _initialized: boolean = false;
    private surface: Surface
    private _canvasEl: HTMLCanvasElement
    private offsetX = 0;
    private offsetY = 0;
    private _stage: Stage

    private needsRender = false;
    private scale = 1;
    private _slugId: string;

    tickBefore = new Signal();
    tick = new Signal();
    
    constructor(slugId: string, stage: Stage) {
        this._slugId = slugId;
        this._stage = stage 
    }

    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement;
        if (!canvas) {
            return false;
        }
        this._canvasEl = canvas
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // set canvas styles
        setCanvasStyles(this._canvasEl)

        this.surface = canvasKit.MakeWebGLCanvasSurface(canvas)!
        
        this._initialized = true;
        
        return true
    }
    
    render() {
        const draw = (ctx: SkiaCanvas) => {
            ctx.clear(canvasKit.WHITE);

            ctx.save()
            ctx.scale(this.scale, this.scale)
            ctx.translate(this.offsetX, this.offsetY);

            this.drawGrid(ctx)
            
            // render all elements
            this._stage.render({ ctx, scale: this.scale })

            ctx.restore()
        }
        this.surface.requestAnimationFrame(draw.bind(this))
    }

    requestRender() {
        this.needsRender = true;
    }
    
    draw() {
        this.tickBefore.dispatch()
        if (this.needsRender) {
            this.render()
            this.needsRender = false;
            window.requestAnimationFrame(this.draw.bind(this));
        }
        this.tick.dispatch()
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
        // @ts-ignore
        this.upperCanvasEl.removeEventListener('wheel', this.onMouseWheel);
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

    get initialized() {
        return this._initialized;
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
    }
    
    get canvasEl(): HTMLCanvasElement {
        return this._canvasEl
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