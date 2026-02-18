import { WidgetType } from '@/core/constants'
import { Widget } from '../Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Engine } from '@/core/engine/Engine'
import { Line } from '../line/Line'
import { Paint, Path as CkPath } from 'canvaskit-wasm'
import { Layer } from '@/core/stage/Layer'
import { BorderColor } from './Border'

export interface LineBorderProps {
    engine: Engine
    line: Line
    parentLayer: Layer
}

export class LineBorder extends Widget {
    private engine: Engine
    private line: Line
    private paint: Paint
    private _borderPath: CkPath | null = null
    private needsUpdate = true

    constructor(props: LineBorderProps) {
        const bounds = props.line.bounds
        super(WidgetType.BORDER, {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            parentLayer: props.parentLayer,
        })

        this.engine = props.engine
        this.line = props.line

        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        this.paint.setColor(
            canvasKit.Color(BorderColor.r, BorderColor.g, BorderColor.b, 1),
        )
        this.paint.setStrokeJoin(canvasKit.StrokeJoin.Round)
        this.paint.setStrokeCap(canvasKit.StrokeCap.Round)

        this.listenLine()
        this.engine.canvas.tick.add(this.onTick, this)
    }

    private listenLine() {
        this.line.boundsChanged.add(this.onLineBoundsChanged, this)
    }

    private onLineBoundsChanged() {
        this.needsUpdate = true
    }

    private updateBbox() {
        const bounds = this.line.bounds
        this.left = bounds.left
        this.top = bounds.top
        this.width = bounds.width
        this.height = bounds.height
    }

    private updateBorderPath() {
        const points = this.line.points
        if (points.length < 2) {
            this._borderPath?.delete()
            this._borderPath = null
            return
        }

        this._borderPath?.delete()
        const path = new canvasKit.Path()
        path.moveTo(points[0][0], points[0][1])
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i][0], points[i][1])
        }
        this._borderPath = path
    }

    private onTick() {
        if (this.needsUpdate) {
            this.updateBbox()
            this.updateBorderPath()
            this.needsUpdate = false
        }
    }

    protected renderContent(renderContext: RenderContext): void {
        if (!this._borderPath) return

        this.paint.setStrokeWidth(1 / renderContext.scale)
        renderContext.ctx.drawPath(this._borderPath, this.paint)
    }

    destroy(): void {
        this.line.boundsChanged.remove(this.onLineBoundsChanged, this)
        this.engine.canvas.tick.remove(this.onTick, this)
        this._borderPath?.delete()
        this._borderPath = null
        this.paint.delete()
        super.destroy()
    }
}
