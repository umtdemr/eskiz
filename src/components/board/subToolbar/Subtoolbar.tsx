import { useEffect, useReducer, useRef } from 'react'
import { Engine } from '@/core/engine/Engine'
import './Subtoolbar.scss'
import {
    SelectionChangedProps,
    SelectionService,
} from '@/core/services/SelectionService'
import {
    reducer,
    initialSubtoolbarState,
    ActionKind,
    Action as SubtoolbarAction,
} from './SubtoolbarReducer.tsx'
import clsx from 'clsx'
import { SelectionLayer } from '@/core/stage/SelectionLayer'
import { ButtonAction } from './actions/ButtonAction'
import { FontSizeInput } from './FontSizeInput.tsx'
import { ShapeBorderColorInput } from './actions/ShapeBorderColorInput.tsx'
import { ShapeBgColorInput } from './actions/ShapeBgColorInput.tsx'
import { TextColorInput } from './actions/TextColorInput.tsx'
import { HighlightColorInput } from './actions/HighlightColorInput.tsx'
import { FontStyleInput } from './actions/FontStyleInput.tsx'
import { TextAlignInput } from './actions/TextAlignInput.tsx'
import { useBoundStore } from '@/store/store'
import useOnClickOutside from '@/hooks/UseOutsideClick'
import { MoreOptionsDropdown } from './actions/MoreOptionsDropdown.tsx'
import { LineColorInput } from './actions/LineColorInput.tsx'
import { LineStyleInput } from './actions/LineStyleInput.tsx'
import { StickyNoteBgColorInput } from './actions/StickyNoteBgColorInput.tsx'

export interface SubtoolbarProps {
    engine: Engine
}

export default function Subtoolbar({ engine }: SubtoolbarProps) {
    const [state, dispatch] = useReducer(reducer, initialSubtoolbarState)
    const selectionLayerRef = useRef<SelectionLayer | null>(null)
    const selectionServiceRef = useRef<SelectionService>(
        engine.getService<SelectionService>('selection'),
    )
    const transformTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
    const subtoolbarRef = useRef<HTMLDivElement>(null)
    const { closeDropdown } = useBoundStore()

    useOnClickOutside(subtoolbarRef, () => {
        closeDropdown()
    })

    const handleAction = (action: SubtoolbarAction) => {
        if (
            !action.btnActionProps?.command ||
            action.btnActionProps.command === 'willDo'
        ) {
            return
        }

        const command = engine.getCommand(action.btnActionProps.command)
        const selectionService = selectionServiceRef.current
        const ctx = {
            selectionService,
            engine,
            params: {
                widgets: selectionService.selected,
            },
        }

        command.execute(ctx)
    }

    useEffect(() => {
        const selectionService = selectionServiceRef.current

        selectionLayerRef.current =
            engine.stage.nonCanvasDynamicContainer.selectionLayer

        const onSelectionChanged = (data: SelectionChangedProps) => {
            if (data.type === 'selected') {
                dispatch({
                    type: ActionKind.SHOW,
                    engine,
                })
            } else if (data.type === 'selectionCleared') {
                dispatch({ type: ActionKind.HIDE })
                closeDropdown()
            } else if (data.type === 'updated') {
                // if there is no widgets left in selection
                if (!data.widgets?.length) {
                    dispatch({
                        type: ActionKind.HIDE,
                    })
                    closeDropdown()
                } else {
                    // else rerender the subtoolbar
                    dispatch({
                        type: ActionKind.FORCE_UPDATE,
                        engine,
                    })
                }
            }
        }

        selectionService.selectionChanged.add(onSelectionChanged)

        return () => {
            selectionService.selectionChanged.remove(onSelectionChanged)
        }
    }, [])

    useEffect(() => {
        const onTransform = () => {
            // clear timeout - debouncing
            clearTimeout(transformTimeoutRef.current)

            // hide on zoom, translate
            dispatch({ type: ActionKind.TEMP_HIDE })

            transformTimeoutRef.current = setTimeout(() => {
                dispatch({ type: ActionKind.TEMP_SHOW })
            }, 500)
        }

        const hideSubtoolbar = () => dispatch({ type: ActionKind.TEMP_HIDE })
        const showSubtoolbar = () => dispatch({ type: ActionKind.TEMP_SHOW })

        if (state.show) {
            engine.canvas.transform.add(onTransform)
            engine.dragHandler.moveStarted.add(hideSubtoolbar)
            engine.dragHandler.moveFinished.add(showSubtoolbar)
            engine.resizeHandler.resizeStarted.add(hideSubtoolbar)
            engine.resizeHandler.resizeFinished.add(showSubtoolbar)
            engine.reshapeHandler.reshapeStarted.add(hideSubtoolbar)
            engine.reshapeHandler.reshapeFinished.add(showSubtoolbar)
            engine.rotateHandler.rotateStarted.add(hideSubtoolbar)
            engine.rotateHandler.rotateFinished.add(showSubtoolbar)
        } else {
            engine.canvas.transform.remove(onTransform)
            engine.dragHandler.moveStarted.remove(hideSubtoolbar)
            engine.dragHandler.moveFinished.remove(showSubtoolbar)
            engine.resizeHandler.resizeStarted.remove(hideSubtoolbar)
            engine.resizeHandler.resizeFinished.remove(showSubtoolbar)
            engine.reshapeHandler.reshapeStarted.remove(hideSubtoolbar)
            engine.reshapeHandler.reshapeFinished.remove(showSubtoolbar)
            engine.rotateHandler.rotateStarted.remove(hideSubtoolbar)
            engine.rotateHandler.rotateFinished.remove(showSubtoolbar)
        }

        return () => {
            engine.canvas.transform.remove(onTransform)
            engine.dragHandler.moveStarted.remove(hideSubtoolbar)
            engine.dragHandler.moveFinished.remove(showSubtoolbar)
            engine.resizeHandler.resizeStarted.remove(hideSubtoolbar)
            engine.resizeHandler.resizeFinished.remove(showSubtoolbar)
            engine.reshapeHandler.reshapeStarted.remove(hideSubtoolbar)
            engine.reshapeHandler.reshapeFinished.remove(showSubtoolbar)
            engine.rotateHandler.rotateStarted.remove(hideSubtoolbar)
            engine.rotateHandler.rotateFinished.remove(showSubtoolbar)
        }
    }, [state.show])

    if (!selectionLayerRef.current?.selectionBorder) return null

    const selectedWidgets = selectionServiceRef.current.selected
    const singleWidget =
        selectedWidgets.length === 1 ? selectedWidgets[0] : null
    const widgetAngle = singleWidget?.angle ?? 0
    const normalizedAngle = ((widgetAngle % 360) + 360) % 360
    const rotateControlAtTop =
        singleWidget != null && normalizedAngle > 90 && normalizedAngle < 270

    const position = {
        x: selectionLayerRef.current.selectionBorder.bounds.left,
        y: selectionLayerRef.current.selectionBorder.bounds.top,
    }

    const transformedPos = engine.canvas.transformPoint(
        position,
        engine.canvas.viewportTransform,
    )

    if (!state.show || !state.visible) return null

    return (
        <div
            ref={subtoolbarRef}
            className={clsx('sub_toolbar z-[9]', {
                show: state.show,
            })}
            style={{
                left: `${transformedPos.x}px`,
                top: rotateControlAtTop
                    ? `${transformedPos.y - 100}px`
                    : `${transformedPos.y - 70}px`,
            }}
        >
            <>
                {state.actions.map((action) => {
                    if (action.type === 'seperator') {
                        return (
                            <div
                                key={action.id}
                                className="seperator"
                                role="separator"
                            ></div>
                        )
                    } else if (action.type === 'btnAction') {
                        return (
                            <ButtonAction
                                key={action.id}
                                id={action.id}
                                tooltip={action.tooltip!}
                                onClick={() => handleAction(action)}
                                icon={action.btnActionProps!.icon!}
                            />
                        )
                    } else if (action.type === 'shapeBorderColorInput') {
                        return (
                            <ShapeBorderColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'shapeBgColorInput') {
                        return (
                            <ShapeBgColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'textColorInput') {
                        return (
                            <TextColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'highlightColorInput') {
                        return (
                            <HighlightColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'fontStyleInput') {
                        return (
                            <FontStyleInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'fontSizeInput') {
                        return (
                            <FontSizeInput
                                key={action.id}
                                id={action.id}
                                inputId={'font_size_input'}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'textAlignInput') {
                        return (
                            <TextAlignInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'lineColorInput') {
                        return (
                            <LineColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'lineStyleInput') {
                        return (
                            <LineStyleInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'stickyNoteBgColorInput') {
                        return (
                            <StickyNoteBgColorInput
                                key={action.id}
                                tooltip={action.tooltip!}
                                id={action.id}
                                engine={engine}
                            />
                        )
                    } else if (action.type === 'moreOptions') {
                        return (
                            <div>
                                <MoreOptionsDropdown engine={engine} />
                            </div>
                        )
                    }
                })}
            </>
        </div>
    )
}
