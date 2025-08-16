interface SubtoolbarState {
    show: boolean
    visible: boolean // for temproray hiding - showing, eg: hide on move
}

export enum ActionKind {
    HIDE = 'hide',
    SHOW = 'show',
    TEMP_HIDE = 'temp_hide',
    TEMP_SHOW = 'temp_show',
}

type Actions =
    | { type: ActionKind.HIDE }
    | { type: ActionKind.SHOW }
    | { type: ActionKind.TEMP_HIDE }
    | { type: ActionKind.TEMP_SHOW }

export const initialSubtoolbarState = {
    show: false,
    visible: false,
}

export function reducer(state: SubtoolbarState, action: Actions) {
    switch (action.type) {
        case ActionKind.HIDE:
            return {
                ...state,
                show: false,
                visible: false,
            }
        case ActionKind.SHOW:
            return {
                ...state,
                show: true,
                visible: true,
            }
        case ActionKind.TEMP_HIDE:
            return {
                ...state,
                visible: false,
            }
        case ActionKind.TEMP_SHOW:
            return {
                ...state,
                visible: true,
            }
        default:
            return state
    }
}
