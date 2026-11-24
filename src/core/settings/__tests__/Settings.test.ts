import { describe, it, expect, vi } from 'vitest'
import { Settings } from '../Settings'
import { BoardGridType } from '@/core/constants'

describe('Settings', () => {
    it('starts with line grid and no snapping', () => {
        const settings = new Settings()
        expect(settings.gridType).toBe(BoardGridType.LINES)
        expect(settings.isGridSnapEnabled).toBe(false)
    })

    it('changes only what is given', () => {
        const settings = new Settings()
        const changed = vi.fn()
        settings.changed.add(changed)

        settings.set({ isGridSnapEnabled: true })

        expect(settings.isGridSnapEnabled).toBe(true)
        expect(settings.gridType).toBe(BoardGridType.LINES)
        expect(changed).toHaveBeenCalledWith({
            gridType: BoardGridType.LINES,
            isGridSnapEnabled: true,
        })
    })

    it('stays quiet when nothing changes', () => {
        const settings = new Settings()
        const changed = vi.fn()
        settings.changed.add(changed)

        settings.set({ gridType: BoardGridType.LINES })

        expect(changed).not.toHaveBeenCalled()
    })
})
