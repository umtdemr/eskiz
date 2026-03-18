import CanvasKitInit, {
    CanvasKit,
    Surface,
    Canvas as SkiaCanvas,
    FontMgr,
    Paint,
    Path,
} from 'canvaskit-wasm'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'
import { ZOOM_LEVELS } from '@/helpers/Constant.ts'
import { Stage } from '../stage/Stage'
import { Signal } from '../signal/Signal'
import { BoardGridType } from '../constants'
import { useBoundStore } from '@/store/store'

export type GridType = (typeof BoardGridType)[keyof typeof BoardGridType]

export type Point = {
    x: number
    y: number
}

type Transform = [number, number, number, number, number, number]

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
    canvasEl.style.position = 'absolute'
    canvasEl.style.left = '0'
    canvasEl.style.top = '0'
}

export class Canvas {
    private _initialized: boolean = false
    private surface: Surface
    private _canvasEl: HTMLCanvasElement
    private offsetX = 0
    private offsetY = 0
    private _stage: Stage

    private needsRender = false
    private scale = 1

    private gridPaint: Paint
    private gridPath: Path
    public gridType: GridType = BoardGridType.LINES

    tickBefore = new Signal()
    tick = new Signal()
    transform = new Signal()

    constructor(stage: Stage) {
        this._stage = stage
    }

    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement
        if (!canvas) {
            return false
        }
        this._canvasEl = canvas

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // set canvas styles
        setCanvasStyles(this._canvasEl)

        this.surface = canvasKit.MakeWebGLCanvasSurface(canvas)!

        this.gridPaint = new canvasKit.Paint()
        this.gridPaint.setColor(canvasKit.BLACK)
        this.gridPaint.setAntiAlias(true)

        this.gridPath = new canvasKit.Path()

        this._initialized = true

        const store = useBoundStore.getState()
        this.gridType = store.gridType

        return true
    }

    render() {
        const draw = (ctx: SkiaCanvas) => {
            ctx.clear(canvasKit.Color(239, 239, 239, 1))

            ctx.save()
            ctx.scale(this.scale, this.scale)
            ctx.translate(this.offsetX, this.offsetY)

            const height = this.surface.height()
            const width = this.surface.width()

            const viewport = {
                left: -this.offsetX,
                top: -this.offsetY,
                right: width / this.scale - this.offsetX,
                bottom: height / this.scale - this.offsetY,
            }

            if (this.gridType !== BoardGridType.NONE) {
                this.drawGrid(ctx)
            }

            // render all elements
            this._stage.render({ ctx, scale: this.scale, viewport })

            ctx.restore()
        }
        this.surface.requestAnimationFrame(draw.bind(this))
    }

    requestRender() {
        this.needsRender = true
    }

    draw() {
        this.tickBefore.dispatch()
        if (this.needsRender) {
            this.render()
            this.needsRender = false
            window.requestAnimationFrame(this.draw.bind(this))
        }
        this.tick.dispatch()
        window.requestAnimationFrame(this.draw.bind(this))
    }

    setGridType(type: GridType) {
        this.gridType = type
        this.requestRender()
    }

    drawGrid(ctx: SkiaCanvas) {
        if (this.gridType === BoardGridType.NONE) return

        const height = this.surface.height()
        const width = this.surface.width()
        const baseGridSize = 50

        // Calculate the visible area
        const visibleLeft = -this.offsetX
        const visibleTop = -this.offsetY
        const visibleRight = width / this.scale - this.offsetX
        const visibleBottom = height / this.scale - this.offsetY

        // Calculate the appropriate grid size based on current scale
        const log10Scale = Math.log10(this.scale)
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

        const lineWidth = screenLineWidth / this.scale
        const dotSize = screenDotSize / this.scale

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
        this.gridPaint?.delete()
        this.gridPath?.delete()
    }

    getPointer(e: MouseEvent): Point {
        const pointer = {
            x: e.x,
            y: e.y,
        }

        return this.transformPoint(
            pointer,
            this.invertTransform(this.viewportTransform) as Transform,
        )
    }

    transformPoint(p: Point, t: Transform, ignoreOffset?: boolean) {
        if (ignoreOffset) {
            return {
                x: t[0] * p.x + t[2] * p.y,
                y: t[1] * p.x + t[3] * p.y,
            }
        }
        return {
            x: t[0] * p.x + t[2] * p.y + t[4],
            y: t[1] * p.x + t[3] * p.y + t[5],
        }
    }

    invertTransform(t: Transform) {
        const a = 1 / (t[0] * t[3] - t[1] * t[2]),
            r = [
                a * t[3],
                -a * t[1],
                -a * t[2],
                a * t[0],
            ] as unknown as Transform,
            o = this.transformPoint({ x: t[4], y: t[5] }, r, true)
        r[4] = -o.x
        r[5] = -o.y
        return r
    }

    get viewportTransform(): Transform {
        return [
            this.scale,
            0,
            0,
            this.scale,
            this.offsetX * this.scale,
            this.offsetY * this.scale,
        ]
    }

    get initialized() {
        return this._initialized
    }

    get zoom() {
        return this.scale
    }

    get translateX() {
        return this.offsetX
    }

    set translateX(x: number) {
        this.offsetX = x
        this.transform.dispatch()
    }

    get translateY() {
        return this.offsetY
    }

    set translateY(y: number) {
        this.offsetY = y
        this.transform.dispatch()
    }

    set zoom(newZoom: number) {
        newZoom = Math.min(Math.max(ZOOM_LEVELS.MIN, newZoom), ZOOM_LEVELS.MAX)
        this.scale = newZoom
        this.transform.dispatch()
        this.needsRender = true
    }

    get canvasEl(): HTMLCanvasElement {
        return this._canvasEl
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
