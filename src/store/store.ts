import { create } from 'zustand'
import { createUserSlice, UserSlice } from '@/store/userSlice.ts'
import {
    createCollaboratorsSlice,
    CollaboratorsSlice,
} from '@/store/collaborators.ts'
import { createWindowsSlice, WindowSlice } from '@/store/windows.ts'
import { BoardsSlice, createBoardsSlice } from '@/store/boards.ts'
import { createToolSlice, ToolSlice } from './tool'
import { createSubtoolbarSlice, SubtoolbarSlice } from './subtoolbar'
import { BoardSettingsSlice, creaateBoardSettingsSlice } from './boardSettings'
import { persist } from 'zustand/middleware'
import type { Engine } from '@/core/engine/Engine'

export type ZState = UserSlice &
    CollaboratorsSlice &
    WindowSlice &
    BoardsSlice &
    BoardSettingsSlice &
    ToolSlice &
    SubtoolbarSlice

export const useBoundStore = create<ZState>()(
    persist(
        (...a) => ({
            ...createUserSlice(...a),
            ...createCollaboratorsSlice(...a),
            ...createWindowsSlice(...a),
            ...createBoardsSlice(...a),
            ...creaateBoardSettingsSlice(...a),
            ...createToolSlice(...a),
            ...createSubtoolbarSlice(...a),
        }),
        {
            name: 'board-store',
            partialize: (state) => ({
                pen: state.pen,
                colors: state.colors,
                gridType: state.gridType,
                isGridSnapEnabled: state.isGridSnapEnabled,
            }),
        },
    ),
)

// gives the engine the saved settings and saves every change
export function bindSettings(engine: Engine) {
    const { gridType, isGridSnapEnabled, setSettings } =
        useBoundStore.getState()
    engine.settings.set({ gridType, isGridSnapEnabled })
    engine.settings.changed.add(setSettings)
}
