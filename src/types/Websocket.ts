import {UserPublicData} from "@/types/Auth.ts";
import {WS_EVENTS} from "@/helpers/Constant.ts";


export type WsCommand = "join" | "other"

// defines responses for each request
type CommandBaseResponse = {
    join: WsJoinResponse,
    other: string
}

// defines responses for each request
type CommandBasePayload = {
    join: WsJoinPayload,
    cursor: WsCursorPayload
}

// defines typical error message for the request
export type WsErrorMessage = {
    code: number,
    message: string,
    fields?: any
}

// defines response
export type WsResponse<T extends WsCommand> = {
    error?: WsErrorMessage
} & (
   T extends keyof CommandBaseResponse 
       ? { [K in T]? : CommandBaseResponse[T] }
       : never
)

export type WsPayload<T extends WsCommand> = {
    type: string,
} & (
    T extends keyof CommandBasePayload
        ? { data: CommandBasePayload[T] }
        : never
)

export type WsJoinResponse = {
    online_users: {user: UserPublicData, cursor?: {x: number, y: number}}[]
}

export type WsJoinPayload = {
    board_slug_id: string,
    user_auth_token: string
}

export type WsCursorPayload = {
    x: number,
    y: number
}


export type WsMessage = {
    reply_to?: string
    event?: string
    data: any
}

export type EventUserJoined = {
    event: typeof WS_EVENTS.USER_JOINED,
    data: {
        user: UserPublicData
    }
}

export type EventUserLeft = {
    event: typeof WS_EVENTS.USER_LEFT,
    data: {
        user: UserPublicData
    }
}

export type EventCursor = {
    event: typeof WS_EVENTS.CURSOR,
    data: {
        cursor: {
            user_id: number
            user_name: string
            x: number
            y: number 
        }
    }
}

export type WsEvents = 
    | EventUserLeft
    | EventUserJoined
    | EventCursor
    