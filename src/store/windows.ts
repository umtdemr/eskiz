import {StateCreator} from "zustand/vanilla";

type window = 'online_users_list' | 'invite';

export interface WindowSlice {
    activeWindow: window | null
    openWindow: (newWindow: window | null) => void
    closeAllWindows: () => void
}

export const createWindowsSlice: StateCreator<
    WindowSlice,
    [],
    [],
    WindowSlice
> = (set) => ({
    activeWindow: null,
    openWindow: ((newWindow: window | null) => set({ activeWindow: newWindow })),
    closeAllWindows: (() => set({ activeWindow: null }))
})