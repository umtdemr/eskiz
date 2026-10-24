import { describe, it, expect } from 'vitest'
import { generateActions } from '../SubtoolbarReducer'
import { Widget } from '@/core/shapes/Widget'
import {
    createEngineMock,
    createSelectionService,
    EngineMock,
    makeLine,
    makePen,
    makeRect,
    makeTextBox,
} from '@/test/commandUtils'

const ids = (make: (engine: EngineMock) => Widget[]) => {
    const services: Record<string, unknown> = {}
    const engine = createEngineMock(services)
    services.selection = createSelectionService(engine, make(engine))

    return generateActions(engine).map((action) => action.id)
}

describe('generateActions', () => {
    it('keeps what rect and textbox share', () => {
        expect(ids((e) => [makeRect(e), makeTextBox(e)])).toEqual([
            'duplicate',
            'remove',
            'lock',
            'seperator1',
            'fontStyle',
            'textAlign',
            'fontSize',
            'seperator2',
            'textColor',
            'highlightColor',
            'seperator3',
            'backgroundColor',
            'seperator_more_opitons',
            'moreOptions',
        ])
    })

    it('keeps the border for rect and pen', () => {
        expect(ids((e) => [makeRect(e), makePen(e)])).toEqual([
            'duplicate',
            'remove',
            'lock',
            'seperator3',
            'borderStyleColor',
            'seperator_more_opitons',
            'moreOptions',
        ])
    })

    it('drops separators with nothing between them', () => {
        expect(ids((e) => [makeRect(e), makeLine(e)])).toEqual([
            'duplicate',
            'remove',
            'lock',
            'seperator_more_opitons',
            'moreOptions',
        ])
    })

    it('shows only common actions when one is locked', () => {
        expect(
            ids((e) => [makeRect(e), makeRect(e, { locked: true })]),
        ).toEqual(['duplicate', 'remove', 'lock'])
    })
})
