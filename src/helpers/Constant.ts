export const API_ENDPOINTS = {
    LOGIN: import.meta.env.VITE_BACKEND_URL + 'v1/tokens/authentication',
    REGISTER: import.meta.env.VITE_BACKEND_URL + 'v1/users',
    USER_ME: import.meta.env.VITE_BACKEND_URL + 'v1/users/me',
} as const;