import { StateCreator } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'
import { RGBA } from '@/core/shapes/Color'

export type ColorInStore = {
    color: string
    colorKey: string
    rgba: { r: number; g: number; b: number; a: number }
    name: string
    isCustom?: boolean
}

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
    colors: ColorInStore[]
    changePenThickness: (val: number) => void
    changePenColor: (val: RGBA) => void
    addNewColor: (val: ColorInStore) => void
    removeColor: (color: string) => void
}

export const createToolSlice: StateCreator<
    ToolSlice,
    [],
    [
        ['zustand/persist', { pen: { thickness: number; color: RGBA } }],
        ['zustand/persist', { colors: ColorInStore[] }],
    ],
    ToolSlice
> = persist(
    (set) => ({
        mainMode: ACTION_MODES.SELECT,
        pen: {
            thickness: 2,
            color: { r: 0, g: 0, b: 0, a: 1 },
        },
        colors: [
            {
                colorKey: 'black',
                name: 'Black',
                color: 'rgba(0, 0, 0, 1)',
                rgba: { r: 0, g: 0, b: 0, a: 1 },
            },
            {
                colorKey: 'slate',
                name: 'Slate',
                color: 'rgba(100, 116, 139, 1)',
                rgba: { r: 100, g: 116, b: 139, a: 1 },
            },
            {
                colorKey: 'gray',
                name: 'Gray',
                color: 'rgba(156, 163, 175, 1)',
                rgba: { r: 156, g: 163, b: 175, a: 1 },
            },
            {
                colorKey: 'stone',
                name: 'Stone',
                color: 'rgba(168, 162, 158, 1)',
                rgba: { r: 168, g: 162, b: 158, a: 1 },
            },
            {
                colorKey: 'zinc',
                name: 'Zinc',
                color: 'rgba(113, 113, 122, 1)',
                rgba: { r: 113, g: 113, b: 122, a: 1 },
            },
            {
                colorKey: 'neutral',
                name: 'Neutral',
                color: 'rgba(161, 161, 159, 1)',
                rgba: { r: 161, g: 161, b: 159, a: 1 },
            },
            {
                colorKey: 'red',
                name: 'Red',
                color: 'rgba(239, 68, 68, 1)',
                rgba: { r: 239, g: 68, b: 68, a: 1 },
            },
            {
                colorKey: 'orange',
                name: 'Orange',
                color: 'rgba(249, 115, 22, 1)',
                rgba: { r: 249, g: 115, b: 22, a: 1 },
            },
            {
                colorKey: 'amber',
                name: 'Amber',
                color: 'rgba(251, 191, 36, 1)',
                rgba: { r: 251, g: 191, b: 36, a: 1 },
            },
            {
                colorKey: 'yellow',
                name: 'Yellow',
                color: 'rgba(250, 204, 21, 1)',
                rgba: { r: 250, g: 204, b: 21, a: 1 },
            },
            {
                colorKey: 'lime',
                name: 'Lime',
                color: 'rgba(132, 204, 22, 1)',
                rgba: { r: 132, g: 204, b: 22, a: 1 },
            },
            {
                colorKey: 'green',
                name: 'Green',
                color: 'rgba(34, 197, 94, 1)',
                rgba: { r: 34, g: 197, b: 94, a: 1 },
            },
            {
                colorKey: 'emerald',
                name: 'Emerald',
                color: 'rgba(16, 185, 129, 1)',
                rgba: { r: 16, g: 185, b: 129, a: 1 },
            },
            {
                colorKey: 'teal',
                name: 'Teal',
                color: 'rgba(20, 184, 166, 1)',
                rgba: { r: 20, g: 184, b: 166, a: 1 },
            },
            {
                colorKey: 'cyan',
                name: 'Cyan',
                color: 'rgba(6, 182, 212, 1)',
                rgba: { r: 6, g: 182, b: 212, a: 1 },
            },
            {
                colorKey: 'sky',
                name: 'Sky',
                color: 'rgba(14, 165, 233, 1)',
                rgba: { r: 14, g: 165, b: 233, a: 1 },
            },
            {
                colorKey: 'blue',
                name: 'Blue',
                color: 'rgba(59, 130, 246, 1)',
                rgba: { r: 59, g: 130, b: 246, a: 1 },
            },
            {
                colorKey: 'indigo',
                name: 'Indigo',
                color: 'rgba(99, 102, 241, 1)',
                rgba: { r: 99, g: 102, b: 241, a: 1 },
            },
            {
                colorKey: 'violet',
                name: 'Violet',
                color: 'rgba(139, 92, 246, 1)',
                rgba: { r: 139, g: 92, b: 246, a: 1 },
            },
            {
                colorKey: 'purple',
                name: 'Purple',
                color: 'rgba(168, 85, 247, 1)',
                rgba: { r: 168, g: 85, b: 247, a: 1 },
            },
            {
                colorKey: 'fuchsia',
                name: 'Fuchsia',
                color: 'rgba(192, 38, 211, 1)',
                rgba: { r: 192, g: 38, b: 211, a: 1 },
            },
            {
                colorKey: 'pink',
                name: 'Pink',
                color: 'rgba(236, 72, 153, 1)',
                rgba: { r: 236, g: 72, b: 153, a: 1 },
            },
            {
                colorKey: 'rose',
                name: 'Rose',
                color: 'rgba(244, 63, 94, 1)',
                rgba: { r: 244, g: 63, b: 94, a: 1 },
            },
            {
                colorKey: 'white',
                name: 'White',
                color: 'rgba(255, 255, 255, 1)',
                rgba: { r: 255, g: 255, b: 255, a: 1 },
            },
        ],
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
        addNewColor: (val: ColorInStore) =>
            set((state) => {
                const cIdx = state.colors.findIndex(
                    (color) =>
                        color.rgba.r === val.rgba.r &&
                        color.rgba.g === val.rgba.g &&
                        color.rgba.b === val.rgba.b,
                )
                if (cIdx >= 0) {
                    return state
                }
                return {
                    ...state,
                    colors: [...state.colors, val],
                }
            }),
        removeColor: (colorToRemove: string) =>
            set((state) => {
                const cIdx = state.colors.findIndex(
                    (color) => color.color === colorToRemove,
                )
                if (cIdx === -1) {
                    return state
                }

                // if color is not a custom color, do not remove it
                if (!state.colors[cIdx].isCustom) {
                    return state
                }

                return {
                    ...state,
                    colors: state.colors.filter((_, idx) => idx !== cIdx),
                }
            }),
    }),
    {
        name: 'tool-storage',
        partialize: (state) => ({ pen: state.pen, colors: state.colors }),
    },
)
