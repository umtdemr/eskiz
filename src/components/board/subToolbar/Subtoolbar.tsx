import { useEffect, useReducer, useRef } from 'react'
import {
    Copy,
    Trash2,
    LockKeyholeOpen,
    Baseline,
    WholeWord,
} from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import './Subtoolbar.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
    SelectionChangedProps,
    SelectionService,
} from '@/core/services/SelectionService'
import {
    reducer,
    initialSubtoolbarState,
    ActionKind,
} from './SubtoolbarReducer'
import clsx from 'clsx'
import { SelectionLayer } from '@/core/stage/SelectionLayer'

export interface SubtoolbarProps {
    engine: Engine
}

export default function Subtoolbar({ engine }: SubtoolbarProps) {
    const [state, dispatch] = useReducer(reducer, initialSubtoolbarState)
    const selectionLayerRef = useRef<SelectionLayer | null>(null)
    const transformTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        selectionLayerRef.current =
            engine.stage.nonCanvasDynamicContainer.selectionLayer

        const onSelectionChanged = (data: SelectionChangedProps) => {
            if (data.type === 'selected') {
                dispatch({ type: ActionKind.SHOW })
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
            dispatch({ type: ActionKind.HIDE })

            transformTimeoutRef.current = setTimeout(() => {
                dispatch({ type: ActionKind.SHOW })
            }, 500)
        }

        if (state.show) {
            engine.canvas.transform.add(onTransform)
        } else {
            engine.canvas.transform.remove(onTransform)
        }

        return () => {
            engine.canvas.transform.remove(onTransform)
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="duplicate">
                            <Button className="iconBox">
                                <Copy />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="remove">
                            <Button className="iconBox">
                                <Trash2 />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="lock">
                            <Button className="iconBox">
                                <LockKeyholeOpen />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Lock</TooltipContent>
                </Tooltip>
                <div className="seperator" role="separator"></div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="fontStyle">
                            <Button className="iconBox">
                                <WholeWord />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Font style</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="textColor">
                            <Button className="iconBox">
                                <Baseline />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Text color</TooltipContent>
                </Tooltip>
                <div className="seperator" role="separator"></div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="borderStyleColor">
                            <Button className="iconBox">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    className="lucide lucide-squircle-icon lucide-squircle"
                                >
                                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                                </svg>
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Border style and color</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="backgroundColor">
                            <Button className="iconBox">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    className="lucide lucide-squircle-icon lucide-squircle"
                                >
                                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                                </svg>
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Background color</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
