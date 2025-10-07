import { StateCreator } from 'zustand'

export type ActiveSubtoolbarDropdown = 'shapeBorderColor' | 'shapeBgColor' | null

export interface SubtoolbarSlice {
    activeDropdown: ActiveSubtoolbarDropdown
    setActiveDropdown: (dropdown: ActiveSubtoolbarDropdown) => void
    closeDropdown: () => void
    toggleDropdown: (dropdown: Exclude<ActiveSubtoolbarDropdown, null>) => void
}

export const createSubtoolbarSlice: StateCreator<
    SubtoolbarSlice,
    [],
    [],
    SubtoolbarSlice
> = (set, get) => ({
    activeDropdown: null,
    setActiveDropdown: (dropdown) => set({ activeDropdown: dropdown }),
    closeDropdown: () => set({ activeDropdown: null }),
    toggleDropdown: (dropdown) => {
        const current = get().activeDropdown
        set({ activeDropdown: current === dropdown ? null : dropdown })
    },
})