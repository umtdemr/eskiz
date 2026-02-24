import { Commands } from '@/core/command/Command'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { Copy, LockKeyholeOpen, Trash2, LockKeyhole } from 'lucide-react'
import { WidgetType } from '@/core/constants.ts'

export interface Action {
    id: string
    tooltip?: string
    type:
        | 'seperator'
        | 'btnAction'
        | 'shapeBorderColorInput'
        | 'shapeBgColorInput'
        | 'stickyNoteBgColorInput'
        | 'textColorInput'
        | 'lineColorInput'
        | 'highlightColorInput'
        | 'fontStyleInput'
        | 'fontSizeInput'
        | 'textAlignInput'
        | 'moreOptions'
        | 'lineStyleInput'
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

// helper function to get common actions for all widget types
function getCommonActions(): Action[] {
    return [
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
                command: 'toggleLock',
            },
        },
    ]
}

// actions for shapes
function getShapeActions(): Action[] {
    return [
        ...getCommonActions(),
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
            id: 'fontSize',
            tooltip: 'Font size',
            type: 'fontSizeInput',
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
}

// actions for textboxes
function getTextActions(): Action[] {
    return [
        ...getCommonActions(),
        {
            id: 'seperator1',
            type: 'seperator',
        },
        {
            id: 'fontSize',
            tooltip: 'Font size',
            type: 'fontSizeInput',
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
            id: 'backgroundColor',
            tooltip: 'Background color',
            type: 'shapeBgColorInput',
        },
    ]
}

// actions for path widgets
function getPathActions(): Action[] {
    return [
        ...getCommonActions(),
        {
            id: 'seperator1',
            type: 'seperator',
        },
        {
            id: 'borderStyleColor',
            tooltip: 'Stroke style and color',
            type: 'shapeBorderColorInput',
        },
    ]
}

// actions for lines
function getLineActions(): Action[] {
    return [
        ...getCommonActions(),
        {
            id: 'seperator1',
            type: 'seperator',
        },
        {
            id: 'lineColor',
            tooltip: 'Line color',
            type: 'lineColorInput',
        },
        {
            id: 'lineStyle',
            tooltip: 'Line type',
            type: 'lineStyleInput',
        },
    ]
}

// actions for sticky notes
function getStickyNoteActions(): Action[] {
    return [
        ...getCommonActions(),
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
            id: 'stickyNoteBgColor',
            tooltip: 'Background color',
            type: 'stickyNoteBgColorInput',
        },
    ]
}

// actions for locked widgets
function getLockedActions(): Action[] {
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

export function generateActions(engine: Engine): Action[] {
    const selectionService = engine.getService<SelectionService>('selection')
    if (!selectionService.selected || selectionService.selected.length === 0)
        return []
    if (selectionService.isMultipleSelection()) {
        return getCommonActions()
    }

    const widget = selectionService.selected[0]

    if (widget.isLocked) {
        return getLockedActions()
    }

    const actions: Action[] = []

    switch (widget.widgetType) {
        case WidgetType.SHAPE:
            actions.push(...getShapeActions())
            break
        case WidgetType.TEXTBOX:
            actions.push(...getTextActions())
            break
        case WidgetType.PATH:
            actions.push(...getPathActions())
            break
        case WidgetType.LINE:
            actions.push(...getLineActions())
            break
        case WidgetType.STICKY_NOTE:
            actions.push(...getStickyNoteActions())
            break
        default:
            actions.push(...getCommonActions())
    }

    actions.push(
        {
            id: 'seperator_more_opitons',
            type: 'seperator',
        },
        {
            id: 'moreOptions',
            type: 'moreOptions',
        },
    )

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
