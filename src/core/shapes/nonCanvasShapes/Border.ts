import { Paint } from "canvaskit-wasm";
import { Widget } from "../Widget";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";
import { Layer } from "@/core/stage/Layer";

export interface BorderProps {
    parentLayer: Layer
    widget: Widget
}

export class Border extends Widget {
    private paint: Paint
    private bindWidget?: Widget

    constructor(props: BorderProps) {
        const widgetProps = {
            x: props.widget.left,
            y: props.widget.top,
            width: props.widget.width,
            height: props.widget.height,
            parentLayer: props.parentLayer
        }
        super('border', widgetProps)
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Stroke)
        this.paint.setColor(canvasKit.Color(29, 78, 216, .8))
        
        this.bindWidget = props.widget
        this.listenWidget(this.bindWidget)
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

    listenWidget(widget: Widget) {
        widget.boundsChanged.add(this.onWidgetBoundsChanged, this)
    }

    onWidgetBoundsChanged() {
        this.left = this.bindWidget!.left;
        this.top = this.bindWidget!.top;
        this.width = this.bindWidget!.width;
        this.height = this.bindWidget!.height;
    }

    destroy(): void {
        this.bindWidget?.boundsChanged.remove(this.onWidgetBoundsChanged, this)
    }
}