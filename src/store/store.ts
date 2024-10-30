import { create } from 'zustand';
import {createUserSlice} from "@/store/userSlice.ts";

export const useBoundStore = create((...a) => ({
    ...createUserSlice(...a)
}))