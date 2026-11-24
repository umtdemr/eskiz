import { StateCreator } from 'zustand'
import { defaultSettings, SettingsValues } from '@/core/settings/Settings'

// a copy of engine.settings, kept to persist it and to render the menus
export interface BoardSettingsSlice extends SettingsValues {
    setSettings: (values: SettingsValues) => void
}

export const creaateBoardSettingsSlice: StateCreator<
    BoardSettingsSlice,
    [],
    [['zustand/persist', SettingsValues]],
    BoardSettingsSlice
> = (set) => ({
    ...defaultSettings,
    setSettings: (values: SettingsValues) => set(values),
})
