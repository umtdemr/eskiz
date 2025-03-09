import { Paint } from "canvaskit-wasm";
import { Widget } from "../Widget";
import { Layer } from "@/core/stage/Layer";
import { canvasKit, Point, RenderContext } from "@/core/canvas/Canvas";
import { CanvasMouseEvent } from "@/core/engine/Engine";

export interface MultiSelectorProps {
    x: number
    y: number
    parent: Layer
}

export class MultiSelector extends Widget {
    private paint: Paint
    private initialPosition: Point = {x: 0, y: 0}

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

    onMouseDown(data: CanvasMouseEvent) {
        this.initialPosition = {
            x: data.pointer.x,
            y: data.pointer.y,
        }

        this.width = 0;
        this.height = 0;
        this.left = data.pointer.x
        this.top = data.pointer.y
        this.visible = true;
    }

    onMouseMove(data: CanvasMouseEvent) {
        this.width = Math.abs(data.pointer.x - this.initialPosition.x)
        this.height = Math.abs(data.pointer.y - this.initialPosition.y)

        if (data.pointer.x > this.initialPosition.x) {
            this.left = this.initialPosition.x
        } else {
            this.right = this.initialPosition.x
        }
        
        if (data.pointer.y > this.initialPosition.y) {
            this.top = this.initialPosition.y
        } else {
            this.bottom = this.initialPosition.y
        }
    }

    onMouseUp(data: CanvasMouseEvent) {
        this.visible = false;
    }
}