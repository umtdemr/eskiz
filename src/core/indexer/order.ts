// plain code unit order like fractional-indexing, ties broken by uuid so every client agrees
export function compareOrder(a: string, b: string, aId = '', bId = ''): number {
    if (a !== b) return a < b ? -1 : 1
    if (aId !== bId) return aId < bId ? -1 : 1
    return 0
}

type Ordered = { zIndex: string; uuid?: string }

export function compareLayers(a: Ordered, b: Ordered): number {
    return compareOrder(a.zIndex, b.zIndex, a.uuid, b.uuid)
}
