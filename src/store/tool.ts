import { StateCreator } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'

export interface ToolSlice {
    mainMode: keyof typeof ACTION_MODES
    subMode?: keyof typeof SUB_ACTION_MODES
    changeActiveMode: (
        mainMode: keyof typeof ACTION_MODES,
        subMode?: keyof typeof SUB_ACTION_MODES,
    ) => void
    pen: {
        thickness: number
        color: string
    }
    changePenThickness: (val: number) => void
    changePenColor: (val: string) => void
}

export const createToolSlice: StateCreator<
    ToolSlice,
    [],
    [['zustand/persist', { pen: { thickness: number; color: string } }]],
    ToolSlice
> = persist(
    (set) => ({
        mainMode: ACTION_MODES.SELECT,
        pen: {
            thickness: 2,
            color: 'rgba(0, 0, 0, 1)',
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
        changePenColor: (val: string) =>
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
