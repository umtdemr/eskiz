import {Widget} from "@/core/shapes/Widget.ts";
import {Layer} from "@/core/stage/Layer.ts";
import {RenderContext} from "@/core/canvas/Canvas.ts";
import {CanvasMouseEvent, Engine} from "@/core/engine/Engine.ts";
import {SelectionService} from "@/core/services/SelectionService.ts";

export interface ControlProps {
    x: number;
    y: number;
    selectionLayer: Layer;
}

export type ControlTypes = "corner"

/**
 * Control is mostly a base class for all the other controllers.
 */
export class Control extends Widget {
    protected engine: Engine;
    protected selectionService: SelectionService;
    protected _subType: "corner"

    constructor(props: ControlProps, subType: ControlTypes, engine: Engine, selectionService: SelectionService) {
        super('control', {...props, width: 12, height: 12, parentLayer: props.selectionLayer});
        this._isDynamic = true;
        this._interactive = true;
        this.engine = engine;
        this.selectionService = selectionService;
        this._subType = subType;
    }

    protected renderContent(renderContext: RenderContext) {
    }

    onMouseEnter(): void {
    }

    onMouseLeave(): void {
    }

    onMouseDown(data: CanvasMouseEvent): void {}

    onMouseMove(data: CanvasMouseEvent): void {}

    onMouseUp(data: CanvasMouseEvent): void {}

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