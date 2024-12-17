import { UserPublicData } from "@/types/Auth.ts";
import {StateCreator} from "zustand/vanilla";

export interface CollaboratorsSlice {
    collaboratorsList: UserPublicData[],
    setCollaborators: (data: UserPublicData[]) => void,
}


export const createCollaboratorsSlice: StateCreator<
    CollaboratorsSlice,
    [],
    [],
    CollaboratorsSlice
> = (set) => ({
    collaboratorsList: [],
    setCollaborators: (data: UserPublicData[]) => set((state) => ({ collaboratorsList: data }))
})