import {UserPublicData} from "@/types/Auth.ts";
import {WS_EVENTS} from "@/helpers/Constant.ts";
import {DbWidgetType, SubType} from "@/core/shapes/Widget.ts";


export type WsCommand = "join" | "changeBoardName" | "addWidget" | "fetchPageDetails" | "other"

// defines responses for each request
type CommandBaseResponse = {
    join: WsJoinResponse
    changeBoardName: WsChangeBoardNameResponse
    addWidget: AddWidgetResponse
    fetchPageDetails: FetchPageDetailsResponse
    other: string
}

// defines payloads for each request
type CommandBasePayload = {
    join: WsJoinPayload
    cursor: WsCursorPayload
    changeBoardName: WsChangeBoardNamePayload
    fetchPageDetails: FetchPageDetailsPayload
    addWidget: AddWidgetPayload // todo: implement
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

export type WsChangeBoardNamePayload = {
    board_id: number,
    name: string
}

export type WsChangeBoardNameResponse = {
    name: string
}

export type AddWidgetPayload = {
    page_id: number
    widget_type: DbWidgetType
    sub_type?: SubType
    parent_widget_id?: number
    x: number
    y: number
    width: number
    height: number
    z_index: string
    uuid: string
    properties: Record<string, unknown>
}

export type WsWidget = {
    x: number
    y: number
    width: number
    height: number
    z_index: string
    uuid: string
    properties: Record<string, unknown>
    is_deleted: boolean
    widget_type: string
    sub_type: string
}

export type AddWidgetResponse = {
    widget: any
}

export type FetchPageDetailsPayload = {
    page_id: number
}

export type FetchPageDetailsResponse = {
    widgets: WsWidget[]
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

export type EventBoardNameChanged = {
    event: typeof WS_EVENTS.CHANGE_BOARD_NAME,
    data: {
        changeBoardName: {
            name: string
        }
    }
}

export type WsEvents = 
    | EventUserLeft
    | EventUserJoined
    | EventCursor
    | EventBoardNameChanged
    