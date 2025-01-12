export const API_ENDPOINTS = {
    LOGIN: import.meta.env.VITE_BACKEND_URL + 'v1/tokens/authentication',
    REGISTER: import.meta.env.VITE_BACKEND_URL + 'v1/users',
    USER_ME: import.meta.env.VITE_BACKEND_URL + 'v1/users/me',
    BOARDS: import.meta.env.VITE_BACKEND_URL + 'v1/boards',
    CREATE_BOARD: import.meta.env.VITE_BACKEND_URL + 'v1/boards',
    BOARD: import.meta.env.VITE_BACKEND_URL + 'v1/boards/:slugId',
    INVITE_TO_BOARD: import.meta.env.VITE_BACKEND_URL + 'v1/boards/invite',
} as const;

export const ZOOM_LEVELS = {
    MAX: 4,
    MIN: 0.1
} as const;


export const WS_EVENTS = {
    USER_JOINED: 'USER_JOINED',
    USER_LEFT: 'USER_LEFT',
    CURSOR: 'CURSOR'
} as const;

export const COLLAB_CURSOR_THROTTLING_TIME = 300 as const;