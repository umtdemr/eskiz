import { ACTION_MODES, SUB_ACTION_MODES } from "@/helpers/Constant";
import { Engine } from "../engine/Engine";
import { Service } from "./Service";
import { useBoundStore, ZState } from "@/store/store";
import { Signal } from "../signal/Signal";

export class ToolService extends Service {
    private _tool: keyof typeof ACTION_MODES
    private _prevTool?: keyof typeof ACTION_MODES
    private _subTool?: keyof typeof SUB_ACTION_MODES
    private _prevSubTool?: keyof typeof SUB_ACTION_MODES
    private _storeListener: () => void

    mainModeChanged = new Signal<{ tool: keyof typeof ACTION_MODES, prevTool?: keyof typeof ACTION_MODES }>({ memorize: true })
    subModeChanged = new Signal<{ subTool?: keyof typeof SUB_ACTION_MODES, prevSubTool?: keyof typeof SUB_ACTION_MODES }>({ memorize: true })

    constructor(engine: Engine) {
        super(engine)

        // subscribe to state changes
        this._storeListener = useBoundStore.subscribe(
            this.onStateChange.bind(this)
        )

    }

    onStateChange(state: ZState, prevState: ZState) {
        if (state.mainMode !== prevState.mainMode || this._tool !== state.mainMode) {
            this._tool = state.mainMode
            this._prevTool = prevState.mainMode
            this.mainModeChanged.dispatch({ tool: this._tool, prevTool: this._prevTool })
        }

        if (state.subMode !== prevState.subMode || this._subTool !== state.subMode) {
            this._subTool = state.subMode
            this._prevSubTool = prevState.subMode
            this.subModeChanged.dispatch({ subTool: this._subTool, prevSubTool: this._prevSubTool })
        }
    }

    dispose(): void {
        this._storeListener() // unsubscribe to store
    }
}
