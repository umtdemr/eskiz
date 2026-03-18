import { Layer } from '@/core/stage/Layer'
import { Widget } from '../shapes/Widget'
import { MagnetPoint } from '../shapes/nonCanvasShapes/MagnetPoint'
import { Engine } from '../engine/Engine'

export class MagnetLayer extends Layer {
    private currentWidgetUuid: string | null = null
    private engine: Engine

    constructor(engine: Engine) {
        super({ name: 'MagnetLayer' })
        this.engine = engine
    }

    update(widget: Widget | null, snappedPointIndex: number = -1) {
        // if the widget has changed, recreate snap points
        if (widget?.uuid !== this.currentWidgetUuid) {
            this.clear()
            this.currentWidgetUuid = widget?.uuid || null

            if (widget) {
                const snapPoints = widget.getSnapPoints()
                snapPoints.forEach((pt) => {
                    const mp = new MagnetPoint(
                        {
                            x: pt.x - 5,
                            y: pt.y - 5,
                            width: 10,
                            isSnapped: false,
                        },
                        this.engine,
                    )
                    this.addChildren(mp)
                })
            }
        }

        // update snap state of existing points
        if (this.currentWidgetUuid && widget) {
            const snapPoints = widget.getSnapPoints()
            let index = 0
            for (const child of this._children) {
                if (!(child instanceof MagnetPoint)) continue
                const pt = snapPoints[index]
                if (pt) {
                    child.x = pt.x - 5
                    child.y = pt.y - 5
                    child.isSnapped = index === snappedPointIndex
                }
                index++
            }
        } else {
            this.clear()
            this.currentWidgetUuid = null
        }
    }

    clear() {
        for (const child of this._children) {
            child.destroy()
        }
        this._children.clear()
    }
}
