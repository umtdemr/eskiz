import { Commands } from '@/core/command/Command'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import {
    Baseline,
    Copy,
    LockKeyholeOpen,
    Trash2,
    WholeWord,
} from 'lucide-react'

export interface Action {
    id: string
    tooltip?: string
    icon?: React.ReactNode
    btnActionProps?: {
        command: Commands
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
    | { type: ActionKind.FORCE_UPDATE }

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

    const actions: Action[] = [
        {
            id: 'duplicate',
            tooltip: 'Copy',
            icon: <Copy />,
            btnActionProps: {
                command: 'clone',
            },
        },
        {
            id: 'remove',
            tooltip: 'Remove',
            icon: <Trash2 />,
            btnActionProps: {
                command: 'delete',
            },
        },
        {
            id: 'lock',
            tooltip: 'Lock',
            icon: <LockKeyholeOpen />,
        },
        {
            id: 'seperator',
            tooltip: 'seperator',
        },
        {
            id: 'fontStyle',
            tooltip: 'Font style',
            icon: <WholeWord />,
        },
        {
            id: 'textColor',
            tooltip: 'Text color',
            icon: <Baseline />,
        },
        {
            id: 'seperator1',
            tooltip: 'seperator',
        },
        {
            id: 'borderStyleColor',
            tooltip: 'Border style and color',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-squircle-icon lucide-squircle"
                >
                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                </svg>
            ),
        },
        {
            id: 'backgroundColor',
            tooltip: 'Background color',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-squircle-icon lucide-squircle"
                >
                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                </svg>
            ),
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
                forceUpdateState: state.forceUpdateState + 1,
            }

        default:
            return state
    }
}
