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
    TOOLBAR_BUTTON,
    TOOLBAR_COLORS,
} from '@/helpers/Constant'
import { PenDropdown } from '@/components/board/toolbar/PenDropdown'
import { Engine } from '@/core/engine/Engine'
import { ImageUploadService } from '@/core/services/ImageUploadService'
import { useIsMobile } from '@/hooks/use-mobile'

interface ToolbarProps {
    engine: Engine
}

export default function Toolbar({ engine }: ToolbarProps) {
    const isMobile = useIsMobile()
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

    const history = (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={TOOLBAR_BUTTON}
                        onClick={() => engine.execute('undo', {})}
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
                        className={TOOLBAR_BUTTON}
                        onClick={() => engine.execute('redo', {})}
                        disabled={!historyState.canRedo}
                    >
                        <Redo />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'right'}>
                    <p>Redo</p>
                </TooltipContent>
            </Tooltip>
        </>
    )

    return (
        <div
            className="fixed flex gap-1 rounded p-1 bottom-2 left-1/2 -translate-x-1/2 bg-white md:flex-col md:gap-2 md:p-2 md:bottom-auto md:top-1/2 md:left-5 md:translate-x-0 md:-translate-y-1/2"
            style={{ boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx(TOOLBAR_BUTTON, {
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
                        className={clsx(TOOLBAR_BUTTON, {
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
            <div className="w-[0.5px] h-6 self-center bg-zinc-400 mx-1 md:w-full md:h-[0.5px] md:my-5 md:mx-0" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx(TOOLBAR_BUTTON, {
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
                engine={engine}
                activeMode={activeMode}
                handleShapeModeChange={handleShapeModeChange}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx(TOOLBAR_BUTTON, {
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
                        className={TOOLBAR_BUTTON}
                        onClick={() => {
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
                engine={engine}
                activeMode={activeMode}
                handlePathModeChange={handlePathModeChange}
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={clsx(TOOLBAR_BUTTON, {
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
            {isMobile ? (
                <div
                    className="absolute left-0 bottom-full mb-2 flex gap-1 rounded p-1 bg-white"
                    style={{
                        boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)',
                    }}
                >
                    {history}
                </div>
            ) : (
                <>
                    <div className="w-full h-[0.5px] bg-zinc-400 my-5" />
                    {history}
                </>
            )}
        </div>
    )
}
