import {StateCreator} from "zustand/vanilla";

interface Board {
    name: string
    id: number
    owner_id: number
    created_at: Date
    slug_id: string 
}

export interface BoardsSlice {
    isBoardFetched: boolean
    boardData: Board,
    setBoardData: (data: Board) => void
}


export const createBoardsSlice: StateCreator<
    BoardsSlice,
    [],
    [],
    BoardsSlice
> = (set) => ({
    boardData: {
        name: "",
        id: 0,
        owner_id: 0,
        created_at: new Date(),
        slug_id: ""
    },
    isBoardFetched: false,
    setBoardData: (data: Board) => set({ boardData: data })
})