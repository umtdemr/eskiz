import { Paint } from "canvaskit-wasm";
import { Widget } from "../Widget";
import { Layer } from "@/core/stage/Layer";
import { canvasKit, RenderContext } from "@/core/canvas/Canvas";

export interface MultiSelectorProps {
    x: number
    y: number
    parent: Layer
}

export class MultiSelector extends Widget {
    private paint: Paint
    constructor(props: MultiSelectorProps) {
        super('multiSelector', { x: props.x, y: props.y, width: 0, height: 0, parentLayer: props.parent, visible: false });
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Fill)
        this.paint.setColor(canvasKit.Color(29, 78, 216, .3))
    }

    protected renderContent(renderContext: RenderContext): void {
        const ctx = renderContext.ctx;
        const rect = canvasKit.LTRBRect(
            0,
            0,
            this._width,
            this._height
        )
        ctx.drawRect(rect, this.paint)
    }
}