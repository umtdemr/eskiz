import {StateCreator} from "zustand/vanilla";
import { ACTION_MODES, SUB_ACTION_MODES } from "@/helpers/Constant";

export interface ToolSlice {
    mainMode: keyof typeof ACTION_MODES
    subMode?: keyof typeof SUB_ACTION_MODES,
    changeActiveMode: (mainMode: keyof typeof ACTION_MODES, subMode?: keyof typeof SUB_ACTION_MODES) => void
}

export const createToolSlice: StateCreator<
    ToolSlice,
    [],
    [],
    ToolSlice
> = (set) => ({
    mainMode: ACTION_MODES.SELECT,
    changeActiveMode: (mainMode: keyof typeof ACTION_MODES, subMode?: keyof typeof SUB_ACTION_MODES) => set(() => ({
        mainMode: mainMode,
        subMode: subMode
    }))
})

