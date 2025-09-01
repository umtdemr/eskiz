import { useEffect, useReducer, useRef } from 'react'
import { Engine } from '@/core/engine/Engine'
import './Subtoolbar.scss'
import { TooltipProvider } from '@/components/ui/tooltip'
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

export interface SubtoolbarProps {
    engine: Engine
}

export default function Subtoolbar({ engine }: SubtoolbarProps) {
    const [state, dispatch] = useReducer(reducer, initialSubtoolbarState)
    const selectionLayerRef = useRef<SelectionLayer | null>(null)
    const transformTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

    const handleAction = (action: SubtoolbarAction) => {
        if (!action.btnActionProps?.command) {
            return
        }
        const command = engine.getCommand(action.btnActionProps.command)
        if (!command.canExecute()) {
            return
        }

        command.execute()
    }

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

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

        const onMoveStarted = () => dispatch({ type: ActionKind.TEMP_HIDE })
        const onMoveFinished = () => dispatch({ type: ActionKind.TEMP_SHOW })

        if (state.show) {
            engine.canvas.transform.add(onTransform)
            engine.dragHandler.moveStarted.add(onMoveStarted)
            engine.dragHandler.moveFinished.add(onMoveFinished)
        } else {
            engine.canvas.transform.remove(onTransform)
            engine.dragHandler.moveStarted.remove(onMoveStarted)
            engine.dragHandler.moveFinished.remove(onMoveFinished)
        }

        return () => {
            engine.canvas.transform.remove(onTransform)
            engine.dragHandler.moveStarted.remove(onMoveStarted)
            engine.dragHandler.moveFinished.remove(onMoveFinished)
        }
    }, [state.show])

    if (!selectionLayerRef.current?.selectionBorder) return null

    const position = {
        x: selectionLayerRef.current.selectionBorder.left,
        y: selectionLayerRef.current.selectionBorder.top,
    }

    const transformedPos = engine.canvas.transformPoint(
        position,
        engine.canvas.viewportTransform,
    )

    if (!state.show || !state.visible) return null

    return (
        <div
            className={clsx('sub_toolbar', {
                show: state.show,
            })}
            style={{
                left: `${transformedPos.x}px`,
                top: `${transformedPos.y - 70}px`,
            }}
        >
            <TooltipProvider>
                {state.actions.map((action) => {
                    if (action.tooltip === 'seperator') {
                        return (
                            <div
                                key={action.id}
                                className="seperator"
                                role="separator"
                            ></div>
                        )
                    } else {
                        return (
                            <ButtonAction
                                key={action.id}
                                id={action.id}
                                tooltip={action.tooltip!}
                                onClick={() => handleAction(action)}
                                icon={action.icon!}
                            />
                        )
                    }
                })}
            </TooltipProvider>
        </div>
    )
}
