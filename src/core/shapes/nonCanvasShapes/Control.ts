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
        super('control', {...props, width: 10, height: 10, parentLayer: props.selectionLayer});
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
            0 - w / 2,
            0 - h / 2,
            w / 2,
            h / 2
        )

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 0, 0, 1)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);
        renderContext.ctx.drawOval(rect, paint)
    }

    protected mouseEnter(): void {
    }

    protected mouseLeave(): void {
    }

    contains(pointX: number, pointY: number, scale: number): boolean {
        const worldWidth = this.width / scale;
        const worldHeight = this.height / scale;

        const halfWidth = worldWidth / 2;
        const left = this._x - halfWidth;
        const right = this._x + halfWidth;

        const halfHeight = worldHeight / 2;
        const top = this._y - halfHeight;
        const bottom = this._y + halfHeight;
        const isInside = (
            pointX >= left &&
            pointX <= right &&
            pointY >= top &&
            pointY <= bottom
        );

        return isInside;
    }
}