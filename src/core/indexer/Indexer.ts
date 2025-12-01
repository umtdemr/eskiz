import { generateKeyBetween } from 'fractional-indexing'
import { Layer } from '@/core/stage/Layer'

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
        return generateKeyBetween(prev.zIndex, next?.zIndex)
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

        return generateKeyBetween(prevZIndex, nextLayer?.zIndex)
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
        return generateKeyBetween(maxZIndex, null)
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
        return siblings.sort((a, b) => (a.zIndex < b.zIndex ? -1 : 1))
    }

    /**
     * Generates zIndex to bring a widget to the front (above all siblings).
     */
    generateBringToFrontIndex(widget: Layer, parentLayer: Layer): string {
        const siblings = this.getSortedSiblings(parentLayer)
        if (siblings.length === 0 || siblings[siblings.length - 1] === widget) {
            return widget.zIndex
        }
        // generate index after the current maximum
        const maxZIndex = siblings[siblings.length - 1].zIndex
        return generateKeyBetween(maxZIndex, null)
    }

    /**
     * Generates zIndex to send a widget to the back (below all siblings).
     */
    generateSendToBackIndex(widget: Layer, parentLayer: Layer): string {
        const siblings = this.getSortedSiblings(parentLayer)
        if (siblings.length === 0 || siblings[0] === widget) {
            return widget.zIndex
        }
        // generate index before the current minimum
        const minZIndex = siblings[0].zIndex
        return generateKeyBetween(null, minZIndex)
    }

    /**
     * Generates zIndex to bring a widget forward (one step up).
     */
    generateBringForwardIndex(widget: Layer, parentLayer: Layer): string {
        const siblings = this.getSortedSiblings(parentLayer)
        const currentIndex = siblings.findIndex((s) => s === widget)

        if (currentIndex === -1 || currentIndex === siblings.length - 1) {
            // not found or already at front
            return widget.zIndex
        }

        // move between current position and next widget
        const nextWidget = siblings[currentIndex + 1]
        const afterNext =
            currentIndex + 2 < siblings.length
                ? siblings[currentIndex + 2]
                : null

        return generateKeyBetween(nextWidget.zIndex, afterNext?.zIndex || null)
    }

    /**
     * Generates zIndex to send a widget backward (one step down).
     */
    generateSendBackwardIndex(widget: Layer, parentLayer: Layer): string {
        const siblings = this.getSortedSiblings(parentLayer)
        const currentIndex = siblings.findIndex((s) => s === widget)

        if (currentIndex === -1 || currentIndex === 0) {
            // not found or already at back
            return widget.zIndex
        }

        // move between previous widget and the one before it
        const prevWidget = siblings[currentIndex - 1]
        const beforePrev =
            currentIndex - 2 >= 0 ? siblings[currentIndex - 2] : null

        return generateKeyBetween(beforePrev?.zIndex || null, prevWidget.zIndex)
    }
}
