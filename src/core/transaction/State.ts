import { Widget } from '../shapes/Widget'

export type EditingMethods = 'move' | 'resize'

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
        }
    }

    return state
}
