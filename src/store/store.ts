import { create } from 'zustand';
import {createUserSlice, UserSlice} from "@/store/userSlice.ts";
import {createCollaboratorsSlice, CollaboratorsSlice} from "@/store/collaborators.ts";

export const useBoundStore = create<UserSlice & CollaboratorsSlice>()((...a) => ({
    ...createUserSlice(...a),
    ...createCollaboratorsSlice(...a)
}))