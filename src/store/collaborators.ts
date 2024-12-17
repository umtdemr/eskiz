import { UserPublicData } from "@/types/Auth.ts";
import {StateCreator} from "zustand/vanilla";

export interface CollaboratorsSlice {
    collaboratorsList: UserPublicData[]
}


export const createCollaboratorsSlice: StateCreator<
    CollaboratorsSlice,
    [],
    [],
    CollaboratorsSlice
> = (set) => ({
    collaboratorsList: [],
})