import {Control, ControlProps} from "@/core/shapes/nonCanvasShapes/Control.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import {SelectionService} from "@/core/services/SelectionService.ts";
import {Widget} from "@/core/shapes/Widget.ts";
import {canvasKit, RenderContext} from "@/core/canvas/Canvas.ts";

export enum EdgePosition {
    LEFT,
    TOP,
    RIGHT,
    BOTTOM,
}

export interface EdgeControlProps extends ControlProps {
    position: EdgePosition
}

/**
 * EdgeControl is a control widget for resizing in one direction.
 */
export class EdgeControl extends Control {
    private position: EdgePosition
    private shape: Widget;
    private direction: "horizontal" | "vertical";
    private _debug: boolean = false;
    private _strokeThickness = 2;
    private _hitTestThreshold = 5;
    private _maxThreshold = 30;

    constructor(props: EdgeControlProps, engine: Engine, selectionService: SelectionService) {
        super(props, "corner", engine, selectionService);
        this.position = props.position;
        if (this.position === EdgePosition.LEFT || this.position === EdgePosition.RIGHT ) {
            this.direction = "vertical";
        } else {
            this.direction = "horizontal";
        }
        this.shape = this.selectionService.selected[0]
        this.updateTransform()
    }

    protected renderContent(renderContext: RenderContext) {
        if (!this._debug) {
            return
        }

        const paint = new canvasKit.Paint();
        paint.setAntiAlias(true);
        let w = this._width
        let h = this._height

        if (this.direction === "vertical") {
            w /= renderContext.scale
        } else {
            h /= renderContext.scale
        }

        const rect = canvasKit.LTRBRect(
            0,
            0,
            w,
            h
        )

        paint.setStrokeWidth(0)
        const fillColor = canvasKit.Color(255, 0, 0, 1)
        paint.setColor(fillColor);
        paint.setStyle(canvasKit.PaintStyle.Fill);

        renderContext.ctx.drawRect(rect, paint)
    }

    private updateTransform() {
        switch (this.position) {
            case EdgePosition.LEFT:
                this._y = this.shape.top;
                this._x = this.shape.left;
                this.height = this.shape.height;
                this.width = this._strokeThickness;
                break;
            case EdgePosition.RIGHT:
                this._y = this.shape.top;
                this._x = this.shape.right;
                this.height = this.shape.height;
                this.width = this._strokeThickness;
                break;
            case EdgePosition.TOP:
                this._y = this.shape.top;
                this._x = this.shape.left;
                this.height = this._strokeThickness;
                this.width = this.shape.width;
                break;
            case EdgePosition.BOTTOM:
                this._y = this.shape.bottom;
                this._x = this.shape.left;
                this.height = this._strokeThickness;
                this.width = this.shape.width;
                break;
            default:
                break;
        }
    }

    contains(pointX: number, pointY: number, scale: number): boolean {
        let w = this.width;
        let h = this.height;

        if (this.direction === "vertical") {
            w /= scale;
        } else {
            h /= scale;
        }

        let left = this.left;
        let right = this.left + w;
        let top = this.top;
        let bottom = this.bottom + h;

        let threshold = this._hitTestThreshold / scale;
        threshold = Math.min(threshold, this._maxThreshold)

        if (this.direction === "vertical") {
            left -= threshold
            right += threshold
        } else {
            top -= threshold
            bottom += threshold
        }

        const isInside = (
            pointX >= left &&
            pointX <= right &&
            pointY >= top &&
            pointY <= bottom
        );

        return isInside;
    }

    set debug(bool: boolean) {
        this._debug = bool;
    }
}