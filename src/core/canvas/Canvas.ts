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
import { Settings } from '../settings/Settings'
import { gridLevels, onCoarseLine } from './grid'

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
    private settings: Settings

    private needsRender = false
    private frame = 0

    private gridPaint: Paint
    private gridPath: Path

    tickBefore = new Signal()
    tick = new Signal()
    resized = new Signal()

    camera: Camera

    constructor(stage: Stage, settings: Settings) {
        this._stage = stage
        this.settings = settings
        this.camera = new Camera(this, stage)
        this.onResize = this.onResize.bind(this)
        settings.changed.add(this.requestRender, this)
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

        if (this.settings.gridType !== BoardGridType.NONE) {
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

    private drawGrid(ctx: SkiaCanvas) {
        const { zoom, viewport } = this.camera
        const paint = this.gridPaint

        // sizes in css pixels whatever the zoom
        const lineWidth = 0.4 / zoom
        const dotSize = 3 / zoom
        const maxAlpha = 0.18

        const lines = this.settings.gridType === BoardGridType.LINES
        if (lines) {
            paint.setStyle(canvasKit.PaintStyle.Stroke)
            paint.setStrokeWidth(lineWidth)
            paint.setStrokeCap(canvasKit.StrokeCap.Butt)
        } else {
            paint.setStyle(canvasKit.PaintStyle.Stroke)
            paint.setStrokeWidth(dotSize)
            paint.setStrokeCap(canvasKit.StrokeCap.Round)
        }

        const [fine, coarse] = gridLevels(zoom)
        for (const { size, alpha } of [fine, coarse]) {
            if (alpha * maxAlpha < 0.01) continue
            paint.setAlphaf(alpha * maxAlpha)

            // line numbers, onCoarseLine needs them
            const x0 = Math.ceil(viewport.left / size)
            const x1 = Math.floor(viewport.right / size)
            const y0 = Math.ceil(viewport.top / size)
            const y1 = Math.floor(viewport.bottom / size)
            const fineLevel = size === fine.size

            if (lines) {
                const path = this.gridPath
                path.rewind()
                for (let i = x0; i <= x1; i++) {
                    if (fineLevel && onCoarseLine(i)) continue
                    path.moveTo(i * size, viewport.top)
                    path.lineTo(i * size, viewport.bottom)
                }
                for (let j = y0; j <= y1; j++) {
                    if (fineLevel && onCoarseLine(j)) continue
                    path.moveTo(viewport.left, j * size)
                    path.lineTo(viewport.right, j * size)
                }
                ctx.drawPath(path, paint)
            } else {
                const points: number[] = []
                for (let i = x0; i <= x1; i++) {
                    for (let j = y0; j <= y1; j++) {
                        if (fineLevel && onCoarseLine(i) && onCoarseLine(j))
                            continue
                        points.push(i * size, j * size)
                    }
                }
                ctx.drawPoints(canvasKit.PointMode.Points, points, paint)
            }
        }
    }

    dispose() {
        window.cancelAnimationFrame(this.frame)
        this.settings.changed.remove(this.requestRender, this)
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
