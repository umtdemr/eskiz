import {StateCreator} from "zustand/vanilla";

type window = 'online_users_list';

export interface WindowSlice {
    activeWindow: window | null
    openOnlineUsers: () => void
    closeAllWindows: () => void
}

export const createWindowsSlice: StateCreator<
    WindowSlice,
    [],
    [],
    WindowSlice
> = (set) => ({
    activeWindow: null,
    openOnlineUsers: (() => set({ activeWindow: 'online_users_list' })),
    closeAllWindows: (() => set({ activeWindow: null }))
})