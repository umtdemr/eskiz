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
            }),
        },
    ),
)
