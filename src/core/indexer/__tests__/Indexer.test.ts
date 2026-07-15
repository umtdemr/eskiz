import { describe, it, expect } from 'vitest'
import { Indexer } from '../Indexer'
import { Layer } from '@/core/stage/Layer'

const indexer = new Indexer()

const makeLayer = (zIndex: string) => {
    const layer = new Layer({ name: 'test-layer' })
    layer.zIndex = zIndex
    return layer
}

/** Parent layer with children sorted by the given zIndexes. */
const makeParentWithChildren = (...zIndexes: string[]) => {
    const parent = makeLayer('a0')
    const children = zIndexes.map((z) => makeLayer(z))
    parent.addChildren(...children)
    return { parent, children }
}

describe('Indexer', () => {
    it('generates a root index', () => {
        expect(indexer.generateRootIndex()).toBe('a0')
    })

    it('generates an index between two layers', () => {
        const prev = makeLayer('a0')
        const next = makeLayer('a2')

        const index = indexer.generateIndex(prev, next)

        expect(index > prev.zIndex).toBe(true)
        expect(index < next.zIndex).toBe(true)
    })

    it('generates an index after the previous layer when there is no next', () => {
        const prev = makeLayer('a0')

        const index = indexer.generateIndex(prev, null)

        expect(index > prev.zIndex).toBe(true)
    })

    it('generateIndexAfter is strictly greater', () => {
        expect(indexer.generateIndexAfter('a0') > 'a0').toBe(true)
        expect(indexer.generateIndexAfter('a5') > 'a5').toBe(true)
    })

    it('generates widget indexes above the last child', () => {
        const { parent, children } = makeParentWithChildren('a1', 'a2')

        const index = indexer.generateIndexForWidget(parent, null)

        expect(index > children[1].zIndex).toBe(true)
    })

    it('generates widget indexes from the layer itself when empty', () => {
        const parent = makeLayer('a0')

        const index = indexer.generateIndexForWidget(parent, null)

        expect(index > parent.zIndex).toBe(true)
    })

    it('generates child indexes above every sibling', () => {
        // note: generateIndexForChild relies on children being stored in
        // zIndex order (the engine keeps them sorted via repositionChild)
        const { parent, children } = makeParentWithChildren('a1', 'a2', 'a3')

        const index = indexer.generateIndexForChild(parent)

        for (const child of children) {
            expect(index > child.zIndex).toBe(true)
        }
    })

    it('sorts siblings by zIndex', () => {
        const { parent, children } = makeParentWithChildren('a2', 'a0', 'a1')

        const sorted = indexer.getSortedSiblings(parent)

        expect(sorted).toEqual([children[1], children[2], children[0]])
    })

    describe('reordering indexes', () => {
        it('bring to front generates an index above all siblings', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const index = indexer.generateBringToFrontIndex(
                children[0],
                parent,
            )

            expect(index > 'a2').toBe(true)
        })

        it('bring to front keeps the index when already at front', () => {
            const { parent, children } = makeParentWithChildren('a0', 'a1')

            expect(
                indexer.generateBringToFrontIndex(children[1], parent),
            ).toBe('a1')
        })

        it('send to back generates an index below all siblings', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const index = indexer.generateSendToBackIndex(children[2], parent)

            expect(index < 'a0').toBe(true)
        })

        it('send to back keeps the index when already at back', () => {
            const { parent, children } = makeParentWithChildren('a0', 'a1')

            expect(indexer.generateSendToBackIndex(children[0], parent)).toBe(
                'a0',
            )
        })

        it('bring forward moves one step up', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const index = indexer.generateBringForwardIndex(
                children[0],
                parent,
            )

            // lands between the next sibling and the one after it
            expect(index > 'a1').toBe(true)
            expect(index < 'a2').toBe(true)
        })

        it('send backward moves one step down', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const index = indexer.generateSendBackwardIndex(
                children[2],
                parent,
            )

            // lands between the previous sibling and the one before it
            expect(index > 'a0').toBe(true)
            expect(index < 'a1').toBe(true)
        })

        it('bring forward and send backward keep the index at the boundaries', () => {
            const { parent, children } = makeParentWithChildren('a0', 'a1')

            expect(
                indexer.generateBringForwardIndex(children[1], parent),
            ).toBe('a1')
            expect(
                indexer.generateSendBackwardIndex(children[0], parent),
            ).toBe('a0')
        })
    })
})
