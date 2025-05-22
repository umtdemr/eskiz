import {Engine} from "@/core/engine/Engine.ts";
import {Service} from "@/core/services/Service.ts";
import {WebsocketEventService} from "@/core/services/WebsocketEventService.ts";
import {WsEvents} from "@/types/Websocket.ts";
import {useBoundStore} from "@/store/store.ts";
import {BoardUser} from "@/store/boards.ts";
import {getAvatar} from "@/helpers/AuthHelper.ts";

export class CollaboratorsService extends Service {
    private _wsEventService: WebsocketEventService;

    constructor(engine: Engine, wsEventService: WebsocketEventService) {
        super(engine)
        this._wsEventService = wsEventService;
        this._wsEventService.eventDispatchers.get("USER_JOINED")?.add(this.onUserJoined, this)
        this._wsEventService.eventDispatchers.get("USER_LEFT")?.add(this.onUserLeft, this)
        this._wsEventService.eventDispatchers.get("CURSOR")?.add(this.onCursor, this)
    }

    private onUserJoined(event: WsEvents) {
        if (event.event !== "USER_JOINED") {
            return
        }
        const addToCollaborators = useBoundStore.getState().addToCollaborators
        const msgData = event.data;
        const collaborator: BoardUser = {
            full_name: msgData.user.full_name!,
            email: msgData.user.email,
            id: msgData.user.id,
            role: 'editor',
            avatar: getAvatar(msgData.user.full_name)
        }
        addToCollaborators(collaborator)
    }

    private onUserLeft(event: WsEvents) {
        if (event.event !== "USER_LEFT") {
            return
        }

        const removeFromCollaborators = useBoundStore.getState().removeFromCollaborators
        removeFromCollaborators(event.data.user.id)
    }

    private onCursor(event: WsEvents) {
        if (event.event !== "CURSOR") {
            return
        }

        this.engine.upperCanvasRenderer.handleCursorEvent(event, this.engine.canvas)
    }
}