import { StateCreator } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'
import { RGBA } from '@/core/shapes/Color'

export interface ToolSlice {
    mainMode: keyof typeof ACTION_MODES
    subMode?: keyof typeof SUB_ACTION_MODES
    changeActiveMode: (
        mainMode: keyof typeof ACTION_MODES,
        subMode?: keyof typeof SUB_ACTION_MODES,
    ) => void
    pen: {
        thickness: number
        color: RGBA
    }
    changePenThickness: (val: number) => void
    changePenColor: (val: RGBA) => void
}

export const createToolSlice: StateCreator<
    ToolSlice,
    [],
    [['zustand/persist', { pen: { thickness: number; color: RGBA } }]],
    ToolSlice
> = persist(
    (set) => ({
        mainMode: ACTION_MODES.SELECT,
        pen: {
            thickness: 2,
            color: { r: 0, g: 0, b: 0, a: 1 },
        },
        changeActiveMode: (
            mainMode: keyof typeof ACTION_MODES,
            subMode?: keyof typeof SUB_ACTION_MODES,
        ) =>
            set(() => ({
                mainMode: mainMode,
                subMode: subMode,
            })),
        changePenThickness: (val: number) =>
            set((state) => ({
                pen: {
                    ...state.pen,
                    thickness: val,
                },
            })),
        changePenColor: (val: RGBA) =>
            set((state) => ({
                pen: {
                    ...state.pen,
                    color: val,
                },
            })),
    }),
    {
        name: 'pen-tool-storage',
        partialize: (state) => ({ pen: state.pen }),
    },
)
