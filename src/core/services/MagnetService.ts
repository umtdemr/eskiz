import { Service } from '@/core/services/Service'
import { Widget } from '@/core/shapes/Widget'
import { Engine } from '@/core/engine/Engine'

export class MagnetService extends Service {
    constructor(engine: Engine) {
        super(engine)
    }

    scan(
        point: { x: number; y: number },
        proximityThreshold: number = 10,
        snapThreshold: number = 5,
        excludeWidgetId?: string,
    ): {
        nearbyWidget: Widget | null
        snappedPoint: { x: number; y: number } | null
        snappedPointIndex: number
    } {
        let bestWidget: Widget | null = null
        let snappedPoint: { x: number; y: number } | null = null
        let snappedPointIndex: number = -1
        let minSnapDist = snapThreshold

        const layer = this.engine.stage.widgetsDefaultLayer

        if (!layer || !layer.children)
            return {
                nearbyWidget: null,
                snappedPoint: null,
                snappedPointIndex: -1,
            }

        for (const widget of layer.children) {
            if (
                widget instanceof Widget &&
                !widget.isDeleted &&
                widget.visible
            ) {
                if (widget.uuid === excludeWidgetId) continue
                if (!widget.canSnap()) continue

                // check proximity to bounds
                const bounds = widget.bounds
                const expanded = {
                    x: bounds.x - proximityThreshold,
                    y: bounds.y - proximityThreshold,
                    width: bounds.width + 2 * proximityThreshold,
                    height: bounds.height + 2 * proximityThreshold,
                }

                if (
                    point.x >= expanded.x &&
                    point.x <= expanded.x + expanded.width &&
                    point.y >= expanded.y &&
                    point.y <= expanded.y + expanded.height
                ) {
                    // we are near this widget
                    if (!bestWidget) {
                        bestWidget = widget
                    }

                    const snapPoints = widget.getSnapPoints()
                    snapPoints.forEach((sp, index) => {
                        const dx = point.x - sp.x
                        const dy = point.y - sp.y
                        const dist = Math.sqrt(dx * dx + dy * dy)

                        if (dist < minSnapDist) {
                            minSnapDist = dist
                            snappedPoint = { x: sp.x, y: sp.y }
                            snappedPointIndex = index
                            bestWidget = widget // this widget definitely wins if we snap
                        }
                    })
                }
            }
        }

        return { nearbyWidget: bestWidget, snappedPoint, snappedPointIndex }
    }
}
