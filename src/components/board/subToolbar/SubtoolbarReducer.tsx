import { Commands } from '@/core/command/Command'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import {
    Copy,
    LockKeyholeOpen,
    Trash2,
    LockKeyhole,
} from 'lucide-react'

export interface Action {
    id: string
    tooltip?: string
    type:
        | 'seperator'
        | 'btnAction'
        | 'shapeBorderColorInput'
        | 'shapeBgColorInput'
        | 'textColorInput'
        | 'highlightColorInput'
        | 'fontStyleInput'
        | 'textAlignInput'
    btnActionProps?: {
        command: Commands | 'willDo'
        icon?: React.ReactNode
    }
}

interface SubtoolbarState {
    show: boolean
    visible: boolean // for temproray hiding - showing, eg: hide on move
    actions: Action[]
    forceUpdateState: number
}

export enum ActionKind {
    HIDE = 'hide',
    SHOW = 'show',
    TEMP_HIDE = 'temp_hide',
    TEMP_SHOW = 'temp_show',
    FORCE_UPDATE = 'force_update',
}

type Actions =
    | { type: ActionKind.HIDE }
    | { type: ActionKind.SHOW; engine: Engine }
    | { type: ActionKind.TEMP_HIDE }
    | { type: ActionKind.TEMP_SHOW }
    | { type: ActionKind.FORCE_UPDATE; engine: Engine }

export const initialSubtoolbarState: SubtoolbarState = {
    show: false,
    visible: false,
    actions: [],
    forceUpdateState: 0,
}

export function generateActions(engine: Engine): Action[] {
    const selectionService = engine.getService<SelectionService>('selection')
    if (!selectionService.selected) return []
    if (selectionService.isMultipleSelection()) return []

    const widget = selectionService.selected[0]
    if (widget.isLocked) {
        return [
            {
                id: 'unlock',
                tooltip: 'Unlock',
                type: 'btnAction',
                btnActionProps: {
                    command: 'toggleLock',
                    icon: <LockKeyhole />,
                },
            },
        ]
    }

    const actions: Action[] = [
        {
            id: 'duplicate',
            tooltip: 'Copy',
            type: 'btnAction',
            btnActionProps: {
                command: 'clone',
                icon: <Copy />,
            },
        },
        {
            id: 'remove',
            tooltip: 'Remove',
            type: 'btnAction',
            btnActionProps: {
                icon: <Trash2 />,
                command: 'delete',
            },
        },
        {
            id: 'lock',
            tooltip: 'Lock',
            type: 'btnAction',
            btnActionProps: {
                icon: <LockKeyholeOpen />,
                command: 'willDo',
            },
        },
        {
            id: 'seperator1',
            type: 'seperator',
        },
        {
            id: 'fontStyle',
            tooltip: 'Font style',
            type: 'fontStyleInput',
        },
        {
            id: 'textAlign',
            tooltip: 'Text alignment',
            type: 'textAlignInput',
        },
        {
            id: 'seperator2',
            type: 'seperator',
        },
        {
            id: 'textColor',
            tooltip: 'Text color',
            type: 'textColorInput',
        },
        {
            id: 'highlightColor',
            tooltip: 'Highlight color',
            type: 'highlightColorInput',
        },
        {
            id: 'seperator3',
            type: 'seperator',
        },
        {
            id: 'borderStyleColor',
            tooltip: 'Border style and color',
            type: 'shapeBorderColorInput',
        },
        {
            id: 'backgroundColor',
            tooltip: 'Background color',
            type: 'shapeBgColorInput',
        },
    ]

    return actions
}

export function reducer(state: SubtoolbarState, action: Actions) {
    switch (action.type) {
        case ActionKind.HIDE:
            return {
                ...state,
                show: false,
                visible: false,
                actions: [],
            }
        case ActionKind.SHOW:
            const actions = generateActions(action.engine)
            return {
                ...state,
                show: true,
                visible: true,
                actions: actions,
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
        case ActionKind.FORCE_UPDATE:
            return {
                ...state,
                actions: generateActions(action.engine),
                forceUpdateState: state.forceUpdateState + 1,
            }

        default:
            return state
    }
}
