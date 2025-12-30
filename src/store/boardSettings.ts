import { persist } from 'zustand/middleware'
import { GridType } from '@/core/canvas/Canvas'
import { BoardGridType } from '@/core/constants'
import { StateCreator } from 'zustand'

export interface BoardSettingsSlice {
    gridType: GridType
    setGridType: (newType: GridType) => void
}

export const creaateBoardSettingsSlice: StateCreator<
    BoardSettingsSlice,
    [],
    [['zustand/persist', { gridType: GridType }]],
    BoardSettingsSlice
> = persist(
    (set) => ({
        gridType: BoardGridType.LINES,
        setGridType: (newType: GridType) => set({ gridType: newType }),
    }),
    {
        name: 'board-settings-storage',
        partialize: (state) => ({ gridType: state.gridType }),
    },
)
