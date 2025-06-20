import {Widget} from "@/core/shapes/Widget.ts";
import {Layer} from "@/core/stage/Layer.ts";
import {canvasKit, RenderContext} from "@/core/canvas/Canvas.ts";

export enum ControlPosition {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
}

export interface ControlProps {
    x: number;
    y: number;
    position: ControlPosition;
    selectionLayer: Layer;
}

export class Control extends Widget {
    position: ControlPosition
    constructor(props: ControlProps) {
        super('control', {...props, width: 5, height: 5, parentLayer: props.selectionLayer});
        this.position = props.position;
        this._isDynamic = true;
        this._interactive = true;
    }

    protected renderContent(renderContext: RenderContext) {
        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);

        const w = this.width / renderContext.scale
        const h = this.height / renderContext.scale
        const rect = canvasKit.LTRBRect(
            0 - w,
            0 - h,
            w,
            h
        )

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 0, 0, 1)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);
        renderContext.ctx.drawOval(rect, paint)
    }

    contains(x: number, y: number, scale: number): boolean {
        const width = this._width / scale,
            height = this._height / scale;
        if (width <= 0 || height <= 0) return false;
        if (x >= this._x - width / 2  && x <= this._x - width / 2 + width) {
            if (y >= this._y - height / 2 && y <= this._y - height / 2 + height) return true;
        }

        return false;
    }
}