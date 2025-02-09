import { Paint, Canvas as SkiaCanvas } from "canvaskit-wasm";
import { Widget } from "../Widget";
import { Layer } from "@/core/stage/Layer";
import { canvasKit } from "@/core/canvas/Canvas";

export interface MultiSelectorProps {
    x: number
    y: number
    parent: Layer
}

export class MultiSelector extends Widget {
    private paint: Paint
    constructor(props: MultiSelectorProps) {
        super('multiSelector', { x: props.x, y: props.y, width: 0, height: 0, parentLayer: props.parent });
        this.paint = new canvasKit.Paint()
        this.paint.setAntiAlias(true)
        this.paint.setStyle(canvasKit.PaintStyle.Fill)
        this.paint.setColor(canvasKit.Color(29, 78, 216, .5))
    }

    render(ctx: SkiaCanvas): void {
        ctx.translate(this._x, this._y)
        const rect = canvasKit.LTRBRect(
            -this._width / 2,
            -this._height / 2,
            this._width / 2,
            this._height / 2
        )
        ctx.drawRect(rect, this.paint)
    }
}