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

export const CANVAS_COLORS = {
    BLACK: {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    },
    WHITE: {
        r: 255,
        g: 255,
        b: 255,
        a: 1
    },
    RED: {
        r: 220,
        g: 38,
        b: 38,
        a: 1
    },
    GREEN: {
        r: 22,
        g: 163,
        b: 74,
        a: 1
    },
    BLUE: {
        r: 59,
        g: 130,
        b: 246,
        a: 1
    },
    YELLOW: {
        r: 253,
        g: 224,
        b: 71,
        a: 1
    },
    PURPLE: {
        r: 147,
        g: 51,
        b: 234,
        a: 1
    },
    ORANGE: {
        r: 234,
        g: 88,
        b: 12,
        a: 1
    }
} as const;