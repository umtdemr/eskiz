import { create } from 'zustand';
import {createUserSlice, UserSlice} from "@/store/userSlice.ts";
import {createCollaboratorsSlice, CollaboratorsSlice} from "@/store/collaborators.ts";
import {createWindowsSlice, WindowSlice} from "@/store/windows.ts";
import {BoardsSlice, createBoardsSlice} from "@/store/boards.ts";

export const useBoundStore = create<UserSlice & CollaboratorsSlice & WindowSlice & BoardsSlice>()((...a) => ({
    ...createUserSlice(...a),
    ...createCollaboratorsSlice(...a),
    ...createWindowsSlice(...a),
    ...createBoardsSlice(...a)
}))