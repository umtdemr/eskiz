import {
    AddWidgetPayload,
    AddWidgetResponse,
    FetchPageDetailsResponse,
    UpdateWidgetPayload,
    WsChangeBoardNameResponse,
} from '@/types/Websocket.ts'

/**
 * ISyncAdapter defines actions for synchronizing board state.
 * Implementations can be backed by a backend server via a WebSocket connection
 * or locally via IndexedDB.
 */
export interface ISyncAdapter {
    syncTransaction(data: UpdateWidgetPayload): Promise<void>
    fetchPageDetails(pageId: number): Promise<FetchPageDetailsResponse>
    addWidget(data: AddWidgetPayload): Promise<AddWidgetResponse>
    changeBoardName(
        name: string,
        boardId: number,
    ): Promise<WsChangeBoardNameResponse | undefined>
}
