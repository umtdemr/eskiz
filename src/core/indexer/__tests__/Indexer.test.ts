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

    it('gives different keys for the same spot', () => {
        const { parent } = makeParentWithChildren('a0')
        const keys = new Set<string>()
        for (let i = 0; i < 50; i++) {
            keys.add(indexer.generateIndexForWidget(parent, null))
        }
        expect(keys.size).toBe(50)
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

    describe('reorder', () => {
        // applies the keys and returns the order by child position
        const orderAfter = (keys: Map<Layer, string>, children: Layer[]) =>
            [...children]
                .sort((x, y) =>
                    (keys.get(x) ?? x.zIndex) < (keys.get(y) ?? y.zIndex)
                        ? -1
                        : 1,
                )
                .map((c) => children.indexOf(c))
                .join('')

        it('brings to front above every sibling', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const keys = indexer.reorder(parent, [children[0]], 'bringToFront')

            expect(keys.get(children[0])! > 'a2').toBe(true)
        })

        it('sends to back below every sibling', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const keys = indexer.reorder(parent, [children[2]], 'sendToBack')

            expect(keys.get(children[2])! < 'a0').toBe(true)
        })

        it('returns nothing when already in place', () => {
            const { parent, children } = makeParentWithChildren('a0', 'a1')

            expect(
                indexer.reorder(parent, [children[1]], 'bringToFront').size,
            ).toBe(0)
            expect(
                indexer.reorder(parent, [children[1]], 'bringForward').size,
            ).toBe(0)
            expect(
                indexer.reorder(parent, [children[0]], 'sendToBack').size,
            ).toBe(0)
            expect(
                indexer.reorder(parent, [children[0]], 'sendBackward').size,
            ).toBe(0)
        })

        it('moves forward one step', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const key = indexer
                .reorder(parent, [children[0]], 'bringForward')
                .get(children[0])!

            expect(key > 'a1' && key < 'a2').toBe(true)
        })

        it('moves backward one step', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const key = indexer
                .reorder(parent, [children[2]], 'sendBackward')
                .get(children[2])!

            expect(key > 'a0' && key < 'a1').toBe(true)
        })

        it('skips hidden neighbours', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
                'a3',
            )
            children[1].visible = false

            const key = indexer
                .reorder(parent, [children[0]], 'bringForward')
                .get(children[0])!

            expect(key > 'a2' && key < 'a3').toBe(true)
        })

        it('keeps below a hidden widget right above the target', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )
            children[2].visible = false

            const key = indexer
                .reorder(parent, [children[0]], 'bringForward')
                .get(children[0])!

            expect(key > 'a1' && key < 'a2').toBe(true)
        })

        it('stops a selection that is blocked at the edge', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
            )

            const keys = indexer.reorder(
                parent,
                [children[1], children[2]],
                'bringForward',
            )

            expect(keys.size).toBe(0)
        })

        it('keeps the order of a split selection when bringing to front', () => {
            const { parent, children } = makeParentWithChildren(
                'a0',
                'a1',
                'a2',
                'a3',
            )

            const keys = indexer.reorder(
                parent,
                [children[3], children[0]],
                'bringToFront',
            )

            expect(orderAfter(keys, children)).toBe('1203')
        })
    })
})
