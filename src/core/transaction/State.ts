import { Widget } from '../shapes/Widget'
import { Shape } from '@/core/shapes/Shape'
import { TextBox } from '@/core/shapes/text/TextBox'
import { Rectangle } from '@/core/shapes/Rectangle'
import { Path } from '@/core/shapes/path/Path'
import { Line } from '@/core/shapes/line/Line'

export type EditingMethods =
    | 'move'
    | 'resize'
    | 'text'
    | 'delete'
    | 'toggleLock'
    | 'backgroundColor'
    | 'borderColor'
    | 'borderStyle'
    | 'thickness'
    | 'roundness'
    | 'textColor'
    | 'highlightColor'
    | 'textAlign'
    | 'fontSize'
    | 'fontStyle'
    | 'zIndex'
    | 'points'
    | 'arrowPosition'
    | 'headLineBinding'
    | 'tailLineBinding'

export type State = Record<string, unknown>

/*
 * Returns captured partial state of the given widget from given editing methods
 */
export function getPartialState(
    widget: Widget,
    methods: EditingMethods[],
): State {
    let state: State = {}

    const updateState = (newState: Partial<State>) => {
        state = {
            ...newState,
            ...state,
        }
    }

    for (const method of methods) {
        switch (method) {
            case 'delete':
                updateState({ is_deleted: widget.isDeleted })
                break
            case 'move':
                updateState({ x: widget.left, y: widget.top })
                break
            case 'resize':
                updateState({
                    x: widget.left,
                    y: widget.top,
                    width: widget.width,
                    height: widget.height,
                })
                break
            case 'text':
                if (widget instanceof Shape) {
                    updateState({
                        properties: {
                            textProperties: widget.textProperties,
                        },
                    })
                }
                if (widget instanceof TextBox) {
                    updateState({
                        properties: {
                            ...widget.textPropsJson,
                        },
                    })
                }
                break
            case 'toggleLock':
                updateState({
                    is_locked: widget.isLocked,
                })
                break
            case 'backgroundColor':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        fillColor: widget.properties.fillColor,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        fillColor: widget.properties.fillColor,
                    }
                }
                break
            case 'borderColor':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeColor: widget.properties.strokeColor,
                    }
                } else if (widget instanceof Path) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        color: widget.properties.color,
                    }
                } else if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeColor: widget.strokeColor,
                    }
                }
                break
            case 'borderStyle':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        borderStyle: widget.properties.borderStyle,
                    }
                } else if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        borderStyle: widget.borderStyle,
                    }
                }
                break
            case 'thickness':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeWidth: widget.properties.strokeWidth,
                    }
                } else if (widget instanceof Path) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeWidth: widget.properties.strokeWidth,
                    }
                } else if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeWidth: widget.strokeWidth,
                    }
                }
                break
            case 'roundness':
                if (widget instanceof Rectangle) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        radius: widget.properties.radius,
                    }
                }
                break
            case 'textColor':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textProperties: widget.textProperties,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        ...widget.textPropsJson,
                    }
                }
                break
            case 'highlightColor':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textProperties: widget.textProperties,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        ...widget.textPropsJson,
                    }
                }
                break
            case 'textAlign':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textProperties: widget.textProperties,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textAlign: widget.properties.textAlign,
                    }
                }
                break
            case 'fontSize':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textProperties: widget.textProperties,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        fontSize: widget.properties.fontSize,
                    }
                }
                break
            case 'fontStyle':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        textProperties: widget.textProperties,
                    }
                }
                if (widget instanceof TextBox) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        ...widget.textPropsJson,
                    }
                }
                break
            case 'zIndex':
                updateState({
                    z_index: widget.zIndex,
                })
                break
            case 'points':
                if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        points: widget.points,
                    }
                }
                break
            case 'arrowPosition':
                if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        hasHeadArrow: widget.hasHeadArrow,
                        hasTailArrow: widget.hasTailArrow,
                    }
                }
                break
            case 'headLineBinding':
                if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        headBinding: widget.headBinding,
                    }
                }
                break
            case 'tailLineBinding':
                if (widget instanceof Line) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        tailBinding: widget.tailBinding,
                    }
                }
                break
        }
    }

    return state
}
