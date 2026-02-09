import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
    Hand,
    Image,
    MousePointer2,
    MoveUpRight,
    Redo,
    StickyNote,
    Type,
    Undo,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ShapesDropdown } from '@/components/board/toolbar/ShapesDropdown.tsx'
import { useBoundStore } from '@/store/store'
import { useShallow } from 'zustand/react/shallow'
import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'
import { PenDropdown } from '@/components/board/toolbar/PenDropdown'
import { Engine } from '@/core/engine/Engine'
import { ImageUploadService } from '@/core/services/ImageUploadService'

interface ToolbarProps {
    engine: Engine
}

export default function Toolbar({ engine }: ToolbarProps) {
    const [historyState, setHistoryState] = useState({
        canUndo: engine.historyManager.canUndo,
        canRedo: engine.historyManager.canRedo,
    })

    useEffect(() => {
        const onHistoryChanged = (state: {
            canUndo: boolean
            canRedo: boolean
        }) => {
            setHistoryState(state)
        }
        engine.historyManager.historyChanged.add(onHistoryChanged)
        return () => {
            engine.historyManager.historyChanged.remove(onHistoryChanged)
        }
    }, [engine])

    const activeMode = {
        mainMode: useBoundStore(useShallow((state) => state.mainMode)),
        subMode: useBoundStore(useShallow((state) => state.subMode)),
    }

    const changeActiveMode = useBoundStore(
        useShallow((state) => state.changeActiveMode),
    )

    const handleShapeModeChange = useCallback(
        (newMode: keyof typeof SUB_ACTION_MODES) => {
            changeActiveMode(ACTION_MODES.CREATE, newMode)
        },
        [changeActiveMode],
    )

    const handlePathModeChange = useCallback(
        (newMode: keyof typeof SUB_ACTION_MODES) => {
            changeActiveMode(ACTION_MODES.PATH, newMode)
        },
        [changeActiveMode],
    )

    const handleLineModeChange = useCallback(() => {
        changeActiveMode(ACTION_MODES.LINE)
    }, [changeActiveMode])

    return (
        <div
            className="fixed flex gap-2 flex-col rounded p-2 top-[50%] left-5 bg-white"
            style={{
                transform: 'translateY(-50%)',
                boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)',
            }}
        >
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('px-2', {
                                'bg-amber-500':
                                    activeMode?.mainMode ===
                                    ACTION_MODES.SELECT,
                                'hover:bg-amber-500':
                                    activeMode?.mainMode ===
                                    ACTION_MODES.SELECT,
                            })}
                            onClick={() =>
                                changeActiveMode(ACTION_MODES.SELECT)
                            }
                        >
                            <MousePointer2 />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Select</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('px-2', {
                                'bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.PAN,
                                'hover:bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.PAN,
                            })}
                            onClick={() => changeActiveMode(ACTION_MODES.PAN)}
                        >
                            <Hand />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Pan</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="w-full h-[0.5px] bg-zinc-400 my-5" />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('px-2', {
                                'bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.TEXT,
                                'hover:bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.TEXT,
                            })}
                            onClick={() => changeActiveMode(ACTION_MODES.TEXT)}
                        >
                            <Type />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Text</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <ShapesDropdown
                activeMode={activeMode}
                handleShapeModeChange={handleShapeModeChange}
            />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('px-2', {
                                'bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.LINE,
                                'hover:bg-amber-500':
                                    activeMode?.mainMode === ACTION_MODES.LINE,
                            })}
                            onClick={handleLineModeChange}
                        >
                            <MoveUpRight />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Line</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="px-2"
                            onClick={() => {
                                const boardId =
                                    useBoundStore.getState().boardData.id
                                engine
                                    .getService<ImageUploadService>(
                                        'imageUpload',
                                    )
                                    .pickAndUpload()
                            }}
                        >
                            <Image />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Image</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PenDropdown
                activeMode={activeMode}
                handlePathModeChange={handlePathModeChange}
            />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('px-2', {
                                'bg-amber-500':
                                    activeMode?.mainMode ===
                                    ACTION_MODES.STICKY_NOTE,
                                'hover:bg-amber-500':
                                    activeMode?.mainMode ===
                                    ACTION_MODES.STICKY_NOTE,
                            })}
                            onClick={() =>
                                changeActiveMode(ACTION_MODES.STICKY_NOTE)
                            }
                        >
                            <StickyNote />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Sticky note</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="w-full h-[0.5px] bg-zinc-400 my-5" />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="px-2"
                            onClick={() => engine.historyManager.undo()}
                            disabled={!historyState.canUndo}
                        >
                            <Undo />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Undo</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="px-2"
                            onClick={() => engine.historyManager.redo()}
                            disabled={!historyState.canRedo}
                        >
                            <Redo />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Redo</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
