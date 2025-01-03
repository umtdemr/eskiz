import {StateCreator} from "zustand/vanilla";
import {BoardUser} from "@/store/boards.ts";

export interface CollaboratorUser extends BoardUser {
    cursor?: {
        x: number,
        y: number
    }
}


export interface CollaboratorsSlice {
    collaboratorsList: CollaboratorUser[],
    setCollaborators: (data: CollaboratorUser[]) => void,
    addToCollaborators: (data: CollaboratorUser) => void,
    removeFromCollaborators: (id: number) => void,
    updateCursor: (id: number, cursor: { x: number, y: number }) => void,
}


export const createCollaboratorsSlice: StateCreator<
    CollaboratorsSlice,
    [],
    [],
    CollaboratorsSlice
> = (set) => ({
    collaboratorsList: [],
    setCollaborators: (data: CollaboratorUser[]) => set((state) => ({ collaboratorsList: data })),
    addToCollaborators: (data: CollaboratorUser) => set((state) => ({
        collaboratorsList: [data, ...state.collaboratorsList]
    })),
    removeFromCollaborators: (id: number) => set((state) => ({
        collaboratorsList: state.collaboratorsList.filter(user => user.id !== id)
    })),
    updateCursor: (id: number, cursor: { x: number, y: number }) => set((state) => ({
        collaboratorsList: state.collaboratorsList.map(collaborator => {
            if (collaborator.id === id) {
                collaborator.cursor = {
                    x: cursor.x,
                    y: cursor.y
                }
            }
            
            return collaborator
        })
    }))
})