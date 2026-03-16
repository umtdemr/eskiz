import { ISyncAdapter } from '@/core/sync/ISyncAdapter.ts'
import { WsEngine } from '@/core/WsEngine.ts'
import {
    AddWidgetPayload,
    AddWidgetResponse,
    FetchPageDetailsResponse,
    UpdateWidgetPayload,
    WsChangeBoardNameResponse,
} from '@/types/Websocket.ts'

/**
 * WsAdapter implements ISyncAdapter using websocket connection.
 */
export class WsAdapter implements ISyncAdapter {
    private wsEngine: WsEngine

    constructor(wsEngine: WsEngine) {
        this.wsEngine = wsEngine
    }

    async syncTransaction(data: UpdateWidgetPayload): Promise<void> {
        await this.wsEngine.sendAsyncMessage<'updateWidget'>({
            type: 'updateWidget',
            data,
        })
    }

    async fetchPageDetails(pageId: number): Promise<FetchPageDetailsResponse> {
        const response =
            await this.wsEngine.sendAsyncMessage<'fetchPageDetails'>({
                type: 'fetchPageDetails',
                data: { page_id: pageId },
            })
        return response.fetchPageDetails!
    }

    async addWidget(data: AddWidgetPayload): Promise<AddWidgetResponse> {
        const response = await this.wsEngine.sendAsyncMessage<'addWidget'>({
            type: 'addWidget',
            data,
        })
        return response.addWidget!
    }

    async changeBoardName(
        name: string,
        boardId: number,
    ): Promise<WsChangeBoardNameResponse | undefined> {
        const response =
            await this.wsEngine.sendAsyncMessage<'changeBoardName'>({
                type: 'changeBoardName',
                data: { name, board_id: boardId },
            })
        if (response.error) {
            return undefined
        }
        return response.changeBoardName
    }
}
