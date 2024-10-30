export const createUserSlice = (set) => ({
    userData: {
        email: ''
    },
    changeUserData: (val) => set((state) => ({ userData: val }))
})