import { Layer } from '@/core/stage/Layer'
import { Engine } from '@/core/engine/Engine'
import { Trail } from '@/core/shapes/path/Trail'
import { canvasKit } from '../canvas/Canvas'
import { ERASER_TRAIL } from '@/helpers/Constant'

export class TrailLayer extends Layer {
    private engine: Engine
    private _trailWidget: Trail

    private isAnimating: boolean = false
    private trailPoints: { x: number; y: number }[] = []
    private mouseTarget: { x: number; y: number } = { x: 0, y: 0 }

    private readonly NUM_POINTS = ERASER_TRAIL.NUM_POINTS
    private readonly INTERPOLATION_FACTOR = ERASER_TRAIL.INTERPOLATION_FACTOR

    constructor(engine: Engine) {
        super({ name: 'trail_layer' })
        this.engine = engine

        this._trailWidget = new Trail(
            {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                properties: {},
            },
            engine,
        )
        this.addChildren(this._trailWidget)

        this.animate = this.animate.bind(this)
    }

    start(x: number, y: number) {
        this.mouseTarget = { x, y }

        this.trailPoints = Array(this.NUM_POINTS)
            .fill(null)
            .map(() => ({ x, y }))

        this.isAnimating = true
        this.animate()
    }

    update(x: number, y: number) {
        if (!this.isAnimating) return
        this.mouseTarget = { x, y }
    }

    finish() {
        this.isAnimating = false
    }

    private animate(): void {
        if (
            !this.isAnimating &&
            this.trailPoints.every(
                (p) => Math.abs(p.x - this.mouseTarget.x) < 0.1,
            )
        ) {
            this._trailWidget.replacePath(new canvasKit.Path())
            this.engine.canvas.requestRender()
            return
        }

        let target = { ...this.mouseTarget }
        for (const point of this.trailPoints) {
            point.x += (target.x - point.x) * this.INTERPOLATION_FACTOR
            point.y += (target.y - point.y) * this.INTERPOLATION_FACTOR
            target = { ...point }
        }

        const newCkPath = new canvasKit.Path()
        newCkPath.moveTo(this.trailPoints[0].x, this.trailPoints[0].y)
        for (let i = 1; i < this.trailPoints.length; i++) {
            newCkPath.lineTo(this.trailPoints[i].x, this.trailPoints[i].y)
        }

        this._trailWidget.replacePath(newCkPath)

        this.engine.canvas.requestRender()

        requestAnimationFrame(this.animate)
    }
}
