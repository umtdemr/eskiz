import { Paint } from "canvaskit-wasm";
import { Widget } from "../Widget";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";
import { Layer } from "@/core/stage/Layer";
import { BoundingBox } from "@/core/geometry/BoundingBox";

export interface BorderProps {
    parentLayer: Layer
    widgets: Widget[]
}

export class Border extends Widget {
    private paint: Paint
    private bindWidgets?: Widget[]

    constructor(props: BorderProps) {
        const boundingBox = BoundingBox.createWithMerge(...props.widgets)
        const widgetProps = {
            x: boundingBox.left,
            y: boundingBox.top,
            width: boundingBox.width,
            height: boundingBox.height,
            parentLayer: props.parentLayer
        }
        super('border', widgetProps)
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        this.paint.setColor(canvasKit.Color(29, 78, 216, .8))
        
        this.bindWidgets = props.widgets
        this.listenWidgets()
    }

    protected renderContent(renderContext: RenderContext): void {
        const rect = canvasKit.XYWHRect(
            0,
            0,
            this.width,
            this.height,
        )

        this.paint.setStrokeWidth(2 / renderContext.scale)
        renderContext.ctx.drawRect(rect, this.paint)
    }

    listenWidgets() {
        const widget = this.bindWidgets![0]
        widget.boundsChanged.add(this.onWidgetBoundsChanged, this)
    }

    onWidgetBoundsChanged() {
        const boundingBox = BoundingBox.createWithMerge(...this.bindWidgets!)
        this.left = boundingBox.left;
        this.top = boundingBox.top;
        this.width = boundingBox.width;
        this.height = boundingBox.height;
    }

    destroy(): void {
        const widget = this.bindWidgets![0]
        widget.boundsChanged.remove(this.onWidgetBoundsChanged, this)
    }
}