import {Engine} from "@/core/engine/Engine.ts";
import {Service} from "@/core/services/Service.ts";
import {WebsocketEventService} from "@/core/services/WebsocketEventService.ts";
import {WsEvents} from "@/types/Websocket.ts";
import {WS_EVENTS} from "@/helpers/Constant.ts";
import {useBoundStore} from "@/store/store.ts";
import {Signal} from "@/core/signal/Signal.ts";

export class BoardNameService extends Service {
    private _wsEventService: WebsocketEventService;
    private _boardNameEvent = WS_EVENTS.CHANGE_BOARD_NAME;

    boardNameChanged = new Signal<string>()

    constructor(engine: Engine, wsEventService: WebsocketEventService) {
        super(engine);
        this._wsEventService = wsEventService;
        this._wsEventService.eventDispatchers.get(this._boardNameEvent)?.add(this.onBoardNameChange, this)
    }

    private onBoardNameChange(event: WsEvents) {
        if (event.event !== this._boardNameEvent) {
            return
        }

        const changeBoardName = useBoundStore.getState().changeBoardName
        changeBoardName(event.data.changeBoardName.name)

        this.boardNameChanged.dispatch(event.data.changeBoardName.name);
    }

    async changeBoardName(name: string, board_id: number, shouldDispatch = true) {
        const response = await this.engine.wsEngine.sendAsyncMessage<"changeBoardName">({
            type: "changeBoardName",
            data: {
                name,
                board_id,
            }
        })

        if (shouldDispatch && !response.error) {
            this.boardNameChanged.dispatch(name);
        }
        return response
    }
}