import {
    Tooltip,
    TooltipContent,
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
import {
    ACTION_MODES,
    SUB_ACTION_MODES,
    TOOLBAR_COLORS,
} from '@/helpers/Constant'
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
        mainMode: useBoundStore((state) => state.mainMode),
        subMode: useBoundStore((state) => state.subMode),
    }

    const changeActiveMode = useBoundStore((state) => state.changeActiveMode)

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
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx('px-2 [&_svg]:size-5', {
                            'bg-sky-100':
                                activeMode?.mainMode === ACTION_MODES.SELECT,
                        })}
                        onClick={() => changeActiveMode(ACTION_MODES.SELECT)}
                    >
                        <MousePointer2
                            size={64}
                            color={
                                activeMode?.mainMode === ACTION_MODES.SELECT
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                            stroke={
                                activeMode?.mainMode === ACTION_MODES.SELECT
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                            fill={
                                activeMode?.mainMode === ACTION_MODES.SELECT
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Select</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx('px-2 [&_svg]:size-5', {
                            'bg-sky-100':
                                activeMode?.mainMode === ACTION_MODES.PAN,
                        })}
                        onClick={() => changeActiveMode(ACTION_MODES.PAN)}
                    >
                        <Hand
                            color={
                                activeMode?.mainMode === ACTION_MODES.PAN
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Pan</p>
                </TooltipContent>
            </Tooltip>
            <div className="w-full h-[0.5px] bg-zinc-400 my-5" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx('px-2 [&_svg]:size-5', {
                            'bg-sky-100':
                                activeMode?.mainMode === ACTION_MODES.TEXT,
                        })}
                        onClick={() => changeActiveMode(ACTION_MODES.TEXT)}
                    >
                        <Type
                            color={
                                activeMode?.mainMode === ACTION_MODES.TEXT
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Text</p>
                </TooltipContent>
            </Tooltip>
            <ShapesDropdown
                activeMode={activeMode}
                handleShapeModeChange={handleShapeModeChange}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx('px-2 [&_svg]:size-5', {
                            'bg-sky-100':
                                activeMode?.mainMode === ACTION_MODES.LINE,
                        })}
                        onClick={handleLineModeChange}
                    >
                        <MoveUpRight
                            color={
                                activeMode?.mainMode === ACTION_MODES.LINE
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Line</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 [&_svg]:size-5"
                        onClick={() => {
                            const boardId =
                                useBoundStore.getState().boardData.id
                            engine
                                .getService<ImageUploadService>('imageUpload')
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
            <PenDropdown
                activeMode={activeMode}
                handlePathModeChange={handlePathModeChange}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx('px-2 [&_svg]:size-5', {
                            'bg-sky-100':
                                activeMode?.mainMode ===
                                ACTION_MODES.STICKY_NOTE,
                        })}
                        onClick={() =>
                            changeActiveMode(ACTION_MODES.STICKY_NOTE)
                        }
                    >
                        <StickyNote
                            color={
                                activeMode?.mainMode ===
                                ACTION_MODES.STICKY_NOTE
                                    ? TOOLBAR_COLORS.SELECTED
                                    : TOOLBAR_COLORS.DEFAULT
                            }
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Sticky note</p>
                </TooltipContent>
            </Tooltip>
            <div className="w-full h-[0.5px] bg-zinc-400 my-5" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 [&_svg]:size-5"
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
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 [&_svg]:size-5"
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
        </div>
    )
}
