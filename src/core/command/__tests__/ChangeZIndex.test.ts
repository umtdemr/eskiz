import { describe, it, expect, beforeEach } from 'vitest'
import { ChangeZIndex, ZIndexAction } from '../ChangeZIndex'
import { Indexer } from '@/core/indexer/Indexer'
import { Layer } from '@/core/stage/Layer'
import { Rectangle } from '@/core/shapes/Rectangle'
import {
    createCommandCtx,
    createEngineMock,
    EngineMock,
    makeRect,
} from '@/test/commandUtils'

let engine: EngineMock
let layer: Layer
let a: Rectangle
let b: Rectangle
let c: Rectangle

const makeCtx = (selected: Rectangle[], action?: ZIndexAction) =>
    createCommandCtx(engine, { selected, params: { action } })

const order = () => layer.childrenArray
const sortedByZIndex = () =>
    [...layer.childrenArray].sort((x, y) => (x.zIndex < y.zIndex ? -1 : 1))

describe('ChangeZIndex', () => {
    let command: ChangeZIndex

    beforeEach(() => {
        engine = createEngineMock()
        layer = new Layer({ name: 'widgets' })
        Object.assign(engine, {
            stage: { widgetsDefaultLayer: layer, indexer: new Indexer() },
        })

        a = makeRect(engine, { zIndex: 'a1' })
        b = makeRect(engine, { zIndex: 'a2' })
        c = makeRect(engine, { zIndex: 'a3' })
        a.uuid = 'a'
        b.uuid = 'b'
        c.uuid = 'c'
        layer.addChildren(a, b, c)

        command = new ChangeZIndex('changeZIndex')
    })

    it('cannot execute without a selection', () => {
        expect(command.canExecute(makeCtx([]))).toBe(false)
    })

    // widgets are rebuilt per test, so the table refers to them by name
    it.each<[ZIndexAction, string, string]>([
        ['bringToFront', 'a', 'bca'],
        ['bringForward', 'a', 'bac'],
        ['sendBackward', 'c', 'acb'],
        ['sendToBack', 'c', 'cab'],
    ])('%s moves %s and its zIndex', (action, name, expected) => {
        const byName = { a, b, c } as Record<string, Rectangle>
        const names = (list: Layer[]) =>
            list.map((w) => (w as Rectangle).uuid).join('')

        command.execute(makeCtx([byName[name]], action))

        expect(names(order())).toBe(expected)
        expect(names(sortedByZIndex())).toBe(expected)
    })

    it('records the old zIndex in a committed transaction', () => {
        command.execute(makeCtx([a], 'bringToFront'))

        const [type, { editTable }] =
            engine.transactionHandler.begin.mock.calls[0]
        expect(type).toBe('immediate')
        expect(editTable.size).toBe(0)
        expect(engine.transactionHandler.addEditingMethod).toHaveBeenCalledWith(
            'tx-1',
            a,
            'zIndex',
            { z_index: 'a1' },
        )
        expect(engine.transactionHandler.commit).toHaveBeenCalledWith('tx-1')
        expect(engine.canvas.requestRender).toHaveBeenCalledOnce()
    })

    it('keeps the relative order when bringing several to front', () => {
        command.execute(makeCtx([b, a], 'bringToFront'))

        expect(order()).toEqual([c, a, b])
        expect(sortedByZIndex()).toEqual([c, a, b])
    })

    it('keeps the relative order when sending several to back', () => {
        command.execute(makeCtx([c, b], 'sendToBack'))

        expect(order()).toEqual([b, c, a])
        expect(sortedByZIndex()).toEqual([b, c, a])
    })

    it('moves several neighbours forward together', () => {
        const d = makeRect(engine, { zIndex: 'a4' })
        d.uuid = 'd'
        layer.addChildren(d)

        command.execute(makeCtx([a, b], 'bringForward'))

        expect(order()).toEqual([c, a, b, d])
        expect(sortedByZIndex()).toEqual([c, a, b, d])
    })

    it('moves several neighbours backward together', () => {
        command.execute(makeCtx([b, c], 'sendBackward'))

        expect(order()).toEqual([b, c, a])
        expect(sortedByZIndex()).toEqual([b, c, a])
    })

    it('does nothing when the widget is already in place', () => {
        command.execute(makeCtx([c], 'bringToFront'))

        expect(c.zIndex).toBe('a3')
        expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
        expect(engine.canvas.requestRender).not.toHaveBeenCalled()
    })

    it('does nothing without an action', () => {
        command.execute(makeCtx([a]))

        expect(order()).toEqual([a, b, c])
        expect(engine.transactionHandler.begin).not.toHaveBeenCalled()
    })
})
