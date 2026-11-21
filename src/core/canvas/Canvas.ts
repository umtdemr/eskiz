import CanvasKitInit, {
    CanvasKit,
    Surface,
    Canvas as SkiaCanvas,
    FontMgr,
    GrDirectContext,
    Paint,
    Path,
    WebGLContextHandle,
} from 'canvaskit-wasm'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'
import { Stage } from '../stage/Stage'
import { Camera } from './Camera'
import { Signal } from '../signal/Signal'
import { BoardGridType } from '../constants'
import { useBoundStore } from '@/store/store'

export type GridType = (typeof BoardGridType)[keyof typeof BoardGridType]

export type Point = {
    x: number
    y: number
}

export type RenderContext = {
    ctx: SkiaCanvas
    scale: number
    viewport?: {
        left: number
        top: number
        right: number
        bottom: number
    }
}

export const setCanvasStyles = (canvasEl: HTMLCanvasElement) => {
    canvasEl.style.position = 'fixed'
    canvasEl.style.left = '0'
    canvasEl.style.top = '0'
    canvasEl.style.touchAction = 'none'
}

const MAX_DPR = 2

export const getDpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR)

export const sizeCanvas = (canvasEl: HTMLCanvasElement, dpr: number) => {
    canvasEl.width = Math.round(window.innerWidth * dpr)
    canvasEl.height = Math.round(window.innerHeight * dpr)
    canvasEl.style.width = `${window.innerWidth}px`
    canvasEl.style.height = `${window.innerHeight}px`
}

export class Canvas {
    private _initialized: boolean = false
    private glContext: WebGLContextHandle
    private grContext: GrDirectContext
    private surface: Surface
    private skCanvas: SkiaCanvas
    private _canvasEl: HTMLCanvasElement
    private _dpr = 1
    private needsResize = false
    private dprQuery: MediaQueryList | null = null
    private _stage: Stage

    private needsRender = false
    private frame = 0

    private gridPaint: Paint
    private gridPath: Path
    public gridType: GridType = BoardGridType.LINES

    tickBefore = new Signal()
    tick = new Signal()
    resized = new Signal()

    camera: Camera

    constructor(stage: Stage) {
        this._stage = stage
        this.camera = new Camera(this, stage)
        this.onResize = this.onResize.bind(this)
    }

    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement
        if (!canvas) {
            return false
        }
        this._canvasEl = canvas

        // set canvas styles
        setCanvasStyles(this._canvasEl)

        // kept across resizes so the gpu caches survive
        this.glContext = canvasKit.GetWebGLContext(canvas)
        this.grContext = canvasKit.MakeWebGLContext(this.glContext)!
        this.resize()
        window.addEventListener('resize', this.onResize)

        this.gridPaint = new canvasKit.Paint()
        this.gridPaint.setColor(canvasKit.BLACK)
        this.gridPaint.setAntiAlias(true)

        this.gridPath = new canvasKit.Path()

        this._initialized = true

        const store = useBoundStore.getState()
        this.gridType = store.gridType

        return true
    }

    private resize() {
        this._dpr = getDpr()
        sizeCanvas(this._canvasEl, this._dpr)

        this.surface?.delete()
        this.surface = canvasKit.MakeOnScreenGLSurface(
            this.grContext,
            this._canvasEl.width,
            this._canvasEl.height,
            canvasKit.ColorSpace.SRGB,
        )!
        this.skCanvas = this.surface.getCanvas()

        // devicePixelRatio changes when the window moves to another screen
        this.dprQuery?.removeEventListener('change', this.onResize)
        this.dprQuery = window.matchMedia(
            `(resolution: ${window.devicePixelRatio}dppx)`,
        )
        this.dprQuery.addEventListener('change', this.onResize)

        this.resized.dispatch()
    }

    private onResize() {
        this.needsResize = true
    }

    render() {
        const ctx = this.skCanvas
        ctx.clear(canvasKit.Color(239, 239, 239, 1))

        const { zoom, translateX, translateY, viewport } = this.camera
        ctx.save()
        ctx.scale(this._dpr * zoom, this._dpr * zoom)
        ctx.translate(translateX, translateY)

        if (this.gridType !== BoardGridType.NONE) {
            this.drawGrid(ctx)
        }

        // render all elements
        this._stage.render({ ctx, scale: zoom, viewport })

        ctx.restore()
        this.surface.flush()
    }

    requestRender() {
        this.needsRender = true
    }

    draw() {
        this.tickBefore.dispatch()
        if (this.needsResize) {
            this.needsResize = false
            this.resize()
            this.needsRender = true
        }
        if (this.needsRender) {
            this.render()
            this.needsRender = false
        }
        this.tick.dispatch()
        this.frame = window.requestAnimationFrame(this.draw.bind(this))
    }

    setGridType(type: GridType) {
        this.gridType = type
        this.requestRender()
    }

    drawGrid(ctx: SkiaCanvas) {
        if (this.gridType === BoardGridType.NONE) return

        const baseGridSize = 50

        const scale = this.camera.zoom
        const {
            left: visibleLeft,
            top: visibleTop,
            right: visibleRight,
            bottom: visibleBottom,
        } = this.camera.viewport

        // Calculate the appropriate grid size based on current scale
        const log10Scale = Math.log10(scale)
        const power = Math.floor(log10Scale)
        const fraction = log10Scale - power

        // Calculate two grid sizes for smooth transition
        const gridSize1 = baseGridSize * Math.pow(10, -power)
        const gridSize2 = gridSize1 / 10

        // Constant base alpha
        const baseAlpha = 0.18

        // Calculate alpha for smooth transition
        // As we zoom out (fraction 1 -> 0), gridSize2 (small) fades out, gridSize1 (large) fades in
        const alpha1 = (1 - fraction) * baseAlpha
        const alpha2 = fraction * baseAlpha

        // Calculate line width to maintain constant screen pixel size
        const screenLineWidth = 0.4
        const screenDotSize = 3

        const lineWidth = screenLineWidth / scale
        const dotSize = screenDotSize / scale

        if (!this.gridPaint) {
            this.gridPaint = new canvasKit.Paint()
            this.gridPaint.setColor(canvasKit.BLACK)
            this.gridPaint.setAntiAlias(true)
        }
        if (!this.gridPath) {
            this.gridPath = new canvasKit.Path()
        }

        ;[
            { size: gridSize1, alpha: alpha1 },
            { size: gridSize2, alpha: alpha2 },
        ].forEach(({ size, alpha }) => {
            if (alpha <= 0.02) return // Slightly higher threshold to avoid faint ghosting

            this.gridPaint.setAlphaf(alpha)

            const startX = Math.floor(visibleLeft / size) * size
            const endX = Math.ceil(visibleRight / size) * size
            const startY = Math.floor(visibleTop / size) * size
            const endY = Math.ceil(visibleBottom / size) * size

            if (this.gridType === BoardGridType.LINES) {
                this.gridPaint.setStyle(canvasKit.PaintStyle.Stroke)
                this.gridPaint.setStrokeWidth(lineWidth)
                this.gridPaint.setStrokeCap(canvasKit.StrokeCap.Butt)

                this.gridPath.rewind()

                // Draw horizontal lines
                for (let y = startY; y <= endY; y += size) {
                    this.gridPath.moveTo(startX, y)
                    this.gridPath.lineTo(endX, y)
                }

                // Draw vertical lines
                for (let x = startX; x <= endX; x += size) {
                    this.gridPath.moveTo(x, startY)
                    this.gridPath.lineTo(x, endY)
                }

                ctx.drawPath(this.gridPath, this.gridPaint)
            } else {
                // Dots
                this.gridPaint.setStyle(canvasKit.PaintStyle.Stroke)
                this.gridPaint.setStrokeWidth(dotSize)
                this.gridPaint.setStrokeCap(canvasKit.StrokeCap.Round)

                const points: number[] = []
                for (let x = startX; x <= endX; x += size) {
                    for (let y = startY; y <= endY; y += size) {
                        points.push(x, y)
                    }
                }
                ctx.drawPoints(
                    canvasKit.PointMode.Points,
                    points,
                    this.gridPaint,
                )
            }
        })
    }

    dispose() {
        window.cancelAnimationFrame(this.frame)
        window.removeEventListener('resize', this.onResize)
        this.dprQuery?.removeEventListener('change', this.onResize)
        this.gridPaint?.delete()
        this.gridPath?.delete()
        this.surface?.delete()
        this.grContext?.delete()
        if (this.glContext) canvasKit.deleteContext(this.glContext)
    }

    get initialized() {
        return this._initialized
    }

    get canvasEl(): HTMLCanvasElement {
        return this._canvasEl
    }

    get dpr() {
        return this._dpr
    }

    // css pixels
    get width() {
        return this.surface.width() / this._dpr
    }

    get height() {
        return this.surface.height() / this._dpr
    }
}

export class CanvasKitSingleton {
    private static instance: CanvasKit
    private static loading: boolean = false

    private constructor() {}

    public static async getInstance(): Promise<CanvasKit> {
        if (!CanvasKitSingleton.instance && !CanvasKitSingleton.loading) {
            CanvasKitSingleton.loading = true
            CanvasKitSingleton.instance = await CanvasKitInit({
                locateFile: () => canvaskitWasmUrl,
            })
            CanvasKitSingleton.loading = false
        }
        return CanvasKitSingleton.instance
    }
}

export class FontManagerSingleton {
    private static instance: FontMgr

    private constructor() {}

    public static async getInstance(ck: CanvasKit): Promise<FontMgr> {
        if (!FontManagerSingleton.instance) {
            const fontUrl = '/fonts/OpenSans-Regular.ttf'
            const loadFontPromise = await fetch(fontUrl)
            FontManagerSingleton.instance = ck.FontMgr.FromData(
                await loadFontPromise.arrayBuffer(),
            )!
        }
        return FontManagerSingleton.instance
    }
}

export let canvasKit: CanvasKit
export let fontManager: FontMgr

export async function initCanvasKit() {
    if (canvasKit) return
    canvasKit = await CanvasKitSingleton.getInstance()
    fontManager = await FontManagerSingleton.getInstance(canvasKit)
}
