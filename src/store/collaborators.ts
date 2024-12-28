import {StateCreator} from "zustand/vanilla";
import {BoardUser} from "@/store/boards.ts";

export interface CollaboratorsSlice {
    collaboratorsList: BoardUser[],
    setCollaborators: (data: BoardUser[]) => void,
    addToCollaborators: (data: BoardUser) => void,
    removeFromCollaborators: (id: number) => void,
}


export const createCollaboratorsSlice: StateCreator<
    CollaboratorsSlice,
    [],
    [],
    CollaboratorsSlice
> = (set) => ({
    collaboratorsList: [],
    setCollaborators: (data: BoardUser[]) => set((state) => ({ collaboratorsList: data })),
    addToCollaborators: (data: BoardUser) => set((state) => ({
        collaboratorsList: [data, ...state.collaboratorsList]
    })),
    removeFromCollaborators: (id: number) => set((state) => ({
        collaboratorsList: state.collaboratorsList.filter(user => user.id !== id)
    })),
})