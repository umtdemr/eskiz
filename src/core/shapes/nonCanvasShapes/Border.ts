import { Paint } from 'canvaskit-wasm'
import { Widget } from '../Widget'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { Layer } from '@/core/stage/Layer'
import { BoundingBox } from '@/core/geometry/BoundingBox'
import { Engine } from '@/core/engine/Engine'
import { RGBA } from '../Color'

export interface BorderProps {
    parentLayer: Layer
    widgets: Widget[]
    engine: Engine
}

const BorderColor: RGBA = {
    r: 29,
    g: 78,
    b: 216,
    a: 0.8,
}

export class Border extends Widget {
    private engine: Engine
    private paint: Paint
    private bindWidgets?: Widget[]
    private mainWidget: Widget | null
    private needsUpdate = false

    constructor(props: BorderProps) {
        const boundingBox = BoundingBox.createWithMerge(...props.widgets)
        const widgetProps = {
            x: boundingBox.left,
            y: boundingBox.top,
            width: boundingBox.width,
            height: boundingBox.height,
            parentLayer: props.parentLayer,
        }
        super('border', widgetProps)

        this.engine = props.engine
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)

        if (props.widgets.length === 1) {
            this.mainWidget = props.widgets[0]
        }

        if (this.mainWidget?.isLocked) {
            this.paint.setColor(canvasKit.Color(0, 0, 0, 0.8))
        } else {
            this.paint.setColor(
                canvasKit.Color(
                    BorderColor.r,
                    BorderColor.g,
                    BorderColor.b,
                    BorderColor.a,
                ),
            )
        }

        this.bindWidgets = props.widgets
        this.listenWidgets()
        this.engine.canvas.tick.add(this.onTick, this)
    }

    protected renderContent(renderContext: RenderContext): void {
        const rect = canvasKit.XYWHRect(0, 0, this.width, this.height)

        this.paint.setStrokeWidth(1 / renderContext.scale)
        renderContext.ctx.drawRect(rect, this.paint)
    }

    private listenWidgets() {
        const widget = this.bindWidgets![0]
        widget.boundsChanged.add(this.onWidgetBoundsChanged, this)
    }

    private onWidgetBoundsChanged() {
        this.needsUpdate = true
    }

    private updateBbox() {
        const boundingBox = BoundingBox.createWithMerge(...this.bindWidgets!)
        this.left = boundingBox.left
        this.top = boundingBox.top
        this.width = boundingBox.width
        this.height = boundingBox.height
    }

    destroy(): void {
        const widget = this.bindWidgets![0]
        widget.boundsChanged.remove(this.onWidgetBoundsChanged, this)
    }

    private onTick() {
        if (this.needsUpdate) {
            this.updateBbox()
            this.needsUpdate = false
        }
    }
}
