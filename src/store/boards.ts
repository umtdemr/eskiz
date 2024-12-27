import {StateCreator} from "zustand/vanilla";

export interface BoardUser {
    id: number
    email: string
    full_name: string
    role: string
    avatar: string
}

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
    users: BoardUser[],
    setBoardData: (data: Board) => void
    addToUsers: (data: BoardUser[]) => void
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
    users: [],
    isBoardFetched: false,
    setBoardData: (data: Board) => set({ boardData: data, isBoardFetched: true }),
    addToUsers: (data: BoardUser[]) => set(state => ({ users: [ ...state.users, ...data ] }))
})