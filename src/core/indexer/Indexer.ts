import { generateKeyBetween } from 'fractional-indexing'
import {
    generateKeyBetween as keyBetween,
    generateNKeysBetween as keysBetween,
} from 'jittered-fractional-indexing'
import { Layer } from '@/core/stage/Layer'
import { compareLayers } from './order'
import type { ZIndexAction } from '@/core/command/ChangeZIndex'

// layers without bounds count as overlapping
function overlaps(a: Layer, b: Layer) {
    if (!a.bounds || !b.bounds) return true
    return a.bounds.intersects(b.bounds)
}

/**
 * Indexer generates zIndexes for layers and widgets.
 */
export class Indexer {
    constructor() {}

    /**
     * Generates zIndex for root layer.
     * @returns zIndex for root layer.
     */
    generateRootIndex(): string {
        return generateKeyBetween(null, null)
    }

    /**
     * Generates zIndex between two layer.
     * @param prev Prev layer.
     * @param next Next Layer.
     * @returns
     */
    generateIndex(prev: Layer, next: Layer | null) {
        return keyBetween(prev.zIndex, next?.zIndex)
    }

    /**
     * Generates zIndex for the widget.
     * @param layer Widget layer.
     * @param nextLayer Next most layer.
     * @returns Generated zIndex for this widget.
     */
    generateIndexForWidget(layer: Layer, nextLayer: Layer | null): string {
        const lastObj = layer.children.last
        let prevZIndex = layer.zIndex
        if (lastObj) {
            prevZIndex = lastObj.zIndex
        }

        return keyBetween(prevZIndex, nextLayer?.zIndex)
    }

    /**
     * Generates a zIndex strictly after the given zIndex.
     */
    generateIndexAfter(zIndex: string): string {
        return keyBetween(zIndex, null)
    }

    /**
     * Generates a fractional index for a new child in a parent layer.
     * @param parentLayer The parent layer containing the children.
     * @returns A fractional index as a string.
     */
    generateIndexForChild(parentLayer: Layer): string {
        let maxZIndex = parentLayer.zIndex

        // Find the maximum zIndex among siblings
        for (const child of parentLayer.children) {
            maxZIndex = child.zIndex
        }

        // Generate a new index after the maximum zIndex
        return keyBetween(maxZIndex, null)
    }

    /**
     * Gets all siblings (widgets in the same parent layer)
     * sorted by zIndex in ascending order.
     */
    getSortedSiblings(parentLayer: Layer): Layer[] {
        const siblings: Layer[] = []
        for (const child of parentLayer.children) {
            siblings.push(child)
        }
        return siblings.sort(compareLayers)
    }

    // new keys for the widgets that move. forward and backward jump over the first
    // visible sibling that overlaps. keys come from the full list so
    // deleted widgets keep their slot
    reorder(
        parent: Layer,
        widgets: Layer[],
        action: ZIndexAction,
    ): Map<Layer, string> {
        const list = this.getSortedSiblings(parent)
        const selected = new Set(widgets)
        const keys = new Map<Layer, string>()
        const keyOf = (layer: Layer | undefined) =>
            layer ? (keys.get(layer) ?? layer.zIndex) : null
        const up = action === 'bringToFront' || action === 'bringForward'
        const moving = list.filter((l) => selected.has(l))

        if (action === 'bringToFront' || action === 'sendToBack') {
            const visible = list.filter((l) => l.visible)
            const edge = up
                ? visible.slice(-moving.length)
                : visible.slice(0, moving.length)
            // already there
            if (edge.every((l) => selected.has(l))) return keys

            const newKeys = up
                ? keysBetween(list[list.length - 1].zIndex, null, moving.length)
                : keysBetween(null, list[0].zIndex, moving.length)
            moving.forEach((l, i) => keys.set(l, newKeys[i]))
            return keys
        }

        // top-down when going up, so a moved widget doesn't block the next one
        if (up) moving.reverse()

        for (const widget of moving) {
            const i = list.indexOf(widget)
            const step = up ? 1 : -1
            let j = i + step
            while (list[j] && !(list[j].visible && overlaps(list[j], widget)))
                j += step

            const target = list[j]
            // a selected neighbour that couldn't move blocks this one too
            if (!target || selected.has(target)) continue

            keys.set(
                widget,
                up
                    ? keyBetween(keyOf(target), keyOf(list[j + 1]))
                    : keyBetween(keyOf(list[j - 1]), keyOf(target)),
            )
            list.splice(i, 1)
            list.splice(list.indexOf(target) + (up ? 1 : 0), 0, widget)
        }

        return keys
    }
}
