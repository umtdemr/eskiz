import { Widget } from '../shapes/Widget'
import { Shape } from '@/core/shapes/Shape'
import { TextBox } from '@/core/shapes/text/TextBox'

export type EditingMethods =
    | 'move'
    | 'resize'
    | 'text'
    | 'delete'
    | 'toggleLock'
    | 'backgroundColor'
    | 'borderColor'
    | 'borderStyle'

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
                break
            case 'borderColor':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        strokeColor: widget.properties.strokeColor,
                    }
                }
                break
            case 'borderStyle':
                if (widget instanceof Shape) {
                    state.properties = {
                        ...(state.properties ? state.properties : undefined),
                        borderStyle: widget.properties.borderStyle,
                    }
                }
                break
        }
    }

    return state
}
