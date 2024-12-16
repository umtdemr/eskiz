import {UserPublicData} from "@/types/Auth.ts";


export type WsCommand = "join" | "other"

// defines responses for each request
type CommandBaseResponse = {
    join: WsJoinResponse,
    other: string
}

// defines responses for each request
type CommandBasePayload = {
    join: WsJoinPayload,
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
    online_users: UserPublicData[]
}

export type WsJoinPayload = {
    board_slug_id: string,
    user_auth_token: string
}
