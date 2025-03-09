import { generateKeyBetween } from 'fractional-indexing'
import { Layer } from '@/core/stage/Layer';

/**
 * Indexer generates zIndexes for layers and widgets.
 */
export class Indexer {

    constructor() {
    }

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
    generateIndexForWidget(layer: Layer, nextLayer: Layer|null): string {
        const lastObj = layer.children.last
        let prevZIndex = layer.zIndex
        if (lastObj) {
            prevZIndex = lastObj.zIndex
        }

        return generateKeyBetween(prevZIndex, nextLayer?.zIndex);
    }

    /**
     * Generates a fractional index for a new child in a parent layer.
     * @param parentLayer The parent layer containing the children.
     * @returns A fractional index as a string.
     */
    generateIndexForChild(parentLayer: Layer): string {
        let maxZIndex = parentLayer.zIndex;

        // Find the maximum zIndex among siblings
        for (const child of parentLayer.children) {
            maxZIndex = child.zIndex;
        }

        // Generate a new index after the maximum zIndex
        return generateKeyBetween(maxZIndex, null);
    }
}