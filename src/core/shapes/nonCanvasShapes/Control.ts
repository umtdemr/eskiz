import {Widget} from "@/core/shapes/Widget.ts";
import {Layer} from "@/core/stage/Layer.ts";
import {canvasKit, RenderContext} from "@/core/canvas/Canvas.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import {SelectionService} from "@/core/services/SelectionService.ts";

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
    private shape: Widget;
    private engine: Engine;
    private selectionService: SelectionService;
    private _shiftDominantAxis: 'x' | 'y' | undefined;
    private initialBounds = {
        pointerX: 0,
        pointerY: 0,
        widgetX: 0,
        widgetY: 0,
        width: 0,
        height: 0,
        aspectRatio: 1,
    };

    constructor(props: ControlProps, engine: Engine, selectionService: SelectionService) {
        super('control', {...props, width: 10, height: 10, parentLayer: props.selectionLayer});
        this.position = props.position;
        this._isDynamic = true;
        this._interactive = true;
        this.engine = engine;
        this.selectionService = selectionService;
        this.shape = this.selectionService.selected[0]

        this.shape.boundsChanged.add(this.onShapeBoundsChanged, this);
        this.updatePosition()
    }

    private onShapeBoundsChanged() {
        this.updatePosition()
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

    onMouseEnter(): void {
    }

    onMouseLeave(): void {
    }

    onMouseDown(data: CanvasMouseEvent): void {
        this.initialBounds = {
            pointerX: data.pointer.x,
            pointerY: data.pointer.y,
            widgetX: this.shape.left,
            widgetY: this.shape.top,
            width: this.shape.width,
            height: this.shape.height,
            aspectRatio: this.shape.width / this.shape.height,
        }
    }

    onMouseMove(data: CanvasMouseEvent): void {
        this.shape.width = this.initialBounds.width + data.pointer.x - this.initialBounds.pointerX;
        this.shape.height = this.initialBounds.height + data.pointer.y - this.initialBounds.pointerY;
        this.engine.canvas.requestRender()

        let deltaX = data.pointer.x - this.initialBounds.pointerX;
        let deltaY = data.pointer.y - this.initialBounds.pointerY;
        const initial = this.initialBounds;

        // if shift is pressed, need to scale equally
        if (data.e.shiftKey && initial.aspectRatio) {
            // determine the dominant axis
            if (!this._shiftDominantAxis) {
                if (Math.abs(deltaX) / initial.width > Math.abs(deltaY) / initial.height) {
                    this._shiftDominantAxis = 'x';
                } else {
                    this._shiftDominantAxis = 'y';
                }
            }

            const isDiagonalFlip = this.position === ControlPosition.TOP_RIGHT
                || this.position === ControlPosition.BOTTOM_LEFT;

            if (this._shiftDominantAxis === 'x') {
                const lockedY = deltaX / initial.aspectRatio;
                deltaY = isDiagonalFlip ? -lockedY : lockedY;
            } else {
                const lockedX = deltaY * initial.aspectRatio;
                deltaX = isDiagonalFlip ? -lockedX : lockedX;
            }
        }

        switch (this.position) {
            case ControlPosition.BOTTOM_RIGHT:
                this.shape.width = initial.width + deltaX;
                this.shape.height = initial.height + deltaY;
                break;

            case ControlPosition.BOTTOM_LEFT: // Bottom-Left: Anchor is Top-Right
                this.shape.width = initial.width - deltaX;
                this.shape.height = initial.height + deltaY;
                this.shape.left = initial.widgetX + deltaX;
                break;

            case ControlPosition.TOP_RIGHT:
                this.shape.width = initial.width + deltaX;
                this.shape.height = initial.height - deltaY;
                this.shape.top = initial.widgetY + deltaY;
                break;

            case ControlPosition.TOP_LEFT: // Top-Left: Anchor is Bottom-Right
                this.shape.width = initial.width - deltaX;
                this.shape.height = initial.height - deltaY;
                this.shape.left = initial.widgetX + deltaX;
                this.shape.top = initial.widgetY + deltaY;
                break;
        }

        this.engine.canvas.requestRender();
    }

    onMouseUp(data: CanvasMouseEvent): void {
        console.log('up')
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

    updatePosition() {
        switch (this.position) {
            case ControlPosition.TOP_LEFT:
                this._x = this.shape.left;
                this._y = this.shape.top;
                break;
            case ControlPosition.TOP_RIGHT:
                this._x = this.shape.right;
                this._y = this.shape.top;
                break;
            case ControlPosition.BOTTOM_LEFT:
                this._x = this.shape.left;
                this._y = this.shape.bottom;
                break;
            case ControlPosition.BOTTOM_RIGHT:
                this._x = this.shape.right;
                this._y = this.shape.bottom;
                break;
        }
    }

    destroy() {
        this.shape.boundsChanged.remove(this.onShapeBoundsChanged, this);
    }
}