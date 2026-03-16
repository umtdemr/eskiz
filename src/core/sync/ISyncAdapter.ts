import {
    AddWidgetPayload,
    AddWidgetResponse,
    FetchPageDetailsResponse,
    UpdateWidgetPayload,
    WsChangeBoardNameResponse,
} from '@/types/Websocket.ts'

/**
 * ISyncAdapter defines actions for synchronizing board state.
 * Implementations can be backed by WebSockets or IndexedDB.
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
