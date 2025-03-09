import { create } from 'zustand';
import {createUserSlice, UserSlice} from "@/store/userSlice.ts";
import {createCollaboratorsSlice, CollaboratorsSlice} from "@/store/collaborators.ts";
import {createWindowsSlice, WindowSlice} from "@/store/windows.ts";
import {BoardsSlice, createBoardsSlice} from "@/store/boards.ts";
import { createToolSlice, ToolSlice } from './tool';

export type ZState = UserSlice & CollaboratorsSlice & WindowSlice & BoardsSlice & ToolSlice

export const useBoundStore = create<ZState>()((...a) => ({
    ...createUserSlice(...a),
    ...createCollaboratorsSlice(...a),
    ...createWindowsSlice(...a),
    ...createBoardsSlice(...a),
    ...createToolSlice(...a)
}))