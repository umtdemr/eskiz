import { create } from 'zustand';
import {createUserSlice, UserSlice} from "@/store/userSlice.ts";
import {createCollaboratorsSlice, CollaboratorsSlice} from "@/store/collaborators.ts";
import {createWindowsSlice, WindowSlice} from "@/store/windows.ts";

export const useBoundStore = create<UserSlice & CollaboratorsSlice & WindowSlice>()((...a) => ({
    ...createUserSlice(...a),
    ...createCollaboratorsSlice(...a),
    ...createWindowsSlice(...a)
}))