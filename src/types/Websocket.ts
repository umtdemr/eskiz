export type MsgCallback = {
    timeout: boolean,
    data: WsMessage
}

export type WsErrorMessage = {
    code: number,
    message: string,
    fields?: any
}

export type WsMessage = {
    error?: WsErrorMessage
}