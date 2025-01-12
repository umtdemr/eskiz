import {UserPublicData} from "@/types/Auth.ts";
import {StateCreator} from "zustand/vanilla";

export interface UserSlice {
    userData: UserPublicData,
    loginFailed: boolean,
    navigatedToLogin: boolean,
    changeUserData: (val: UserPublicData) => void
    setLoginFailed: (val: boolean) => void,
    setNavigatedToLogin: (val: boolean) => void,
    token: string,
    setToken: (val: string) => void
}

export const initialUserData: UserPublicData = {
    id: 0,
    full_name: "",
    email: "",
    authProvider: "email",
    created_at: new Date(),
}


export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = 
    (set) => ({
        userData: {...initialUserData},
        loginFailed: false,
        navigatedToLogin: false,
        changeUserData: (val: UserPublicData) => set((state) => ({ userData: val })),
        setLoginFailed: (val: boolean) => set((state) => ({ loginFailed: val })),
        setNavigatedToLogin: (val: boolean) => set((state) => ({ navigatedToLogin: val })),
        token: '',
        setToken: (val: string) => set((state) => ({ token: val })),
    })