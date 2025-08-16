interface SubtoolbarState {
    show: boolean
}

export enum ActionKind {
    HIDE = 'hide',
    SHOW = 'show',
}

type Actions = { type: ActionKind.HIDE } | { type: ActionKind.SHOW }

export const initialSubtoolbarState = {
    show: false,
}

export function reducer(state: SubtoolbarState, action: Actions) {
    switch (action.type) {
        case ActionKind.HIDE:
            return {
                ...state,
                show: false,
            }
        case ActionKind.SHOW:
            return {
                ...state,
                show: true,
            }
        default:
            return state
    }
}
