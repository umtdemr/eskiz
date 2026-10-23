import {
    useState,
    useRef,
    ComponentType,
    SVGAttributes,
    useEffect,
} from 'react'
import { clsx } from 'clsx'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Brush, Eraser } from 'lucide-react'
import {
    ACTION_MODES,
    PEN_CONSTANTS,
    SUB_ACTION_MODES,
    TOOLBAR_BUTTON,
    TOOLBAR_COLORS,
} from '@/helpers/Constant'
import useOnClickOutside from '@/hooks/UseOutsideClick'
import useToolShortcut from '@/hooks/UseToolShortcut'
import { Engine } from '@/core/engine/Engine'
import { ColorButton } from '@/components/colorButton/ColorButton'
import { PenColorDropdown } from './PenColorDropdown'
import { useBoundStore } from '@/store/store'
import { closeColorPalette } from '@/components/colorList/colorListUtils'

const tools: {
    tooltip: string
    mode: keyof typeof SUB_ACTION_MODES
    icon?: ComponentType<SVGAttributes<SVGElement>>
}[] = [
    {
        tooltip: 'Pen',
        mode: SUB_ACTION_MODES.DRAW_PEN,
        icon: Brush,
    },
    {
        tooltip: 'Eraser',
        mode: SUB_ACTION_MODES.ERASER,
        icon: Eraser,
    },
]

export function PenDropdown({
    engine,
    activeMode,
    handlePathModeChange,
}: {
    engine: Engine
    activeMode: {
        mainMode: keyof typeof ACTION_MODES
        subMode?: keyof typeof SUB_ACTION_MODES
    }
    handlePathModeChange: (newMode: keyof typeof SUB_ACTION_MODES) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [showColorDropdown, setShowColorDropdown] = useState(false)
    const menuRef = useRef(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const thickness = useBoundStore((state) => state.pen.thickness)
    const selectedColor = useBoundStore((state) => state.pen.color)

    const onClickOutsideHandler = (event: Event) => {
        if (buttonRef.current!.contains(event.target as Node)) {
            return
        }
        closeColorPalette.dispatch() // send signal to color palette
        setIsOpen(false)
    }
    useOnClickOutside(menuRef, onClickOutsideHandler, isOpen)
    useToolShortcut(engine, ACTION_MODES.PATH, setIsOpen)

    const handleClick = () => {
        setIsOpen((old) => !old)
        if (activeMode.mainMode === ACTION_MODES.PATH) {
            return
        }
        handlePathModeChange(SUB_ACTION_MODES.DRAW_PEN)
    }

    const colorBtnClickHandler = () => {
        setShowColorDropdown((old) => !old)
    }

    useEffect(() => {
        if (!isOpen) {
            setShowColorDropdown(false)
        }
    }, [isOpen])

    return (
        <div className="relative" ref={menuRef}>
            <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx(TOOLBAR_BUTTON, {
                                'bg-sky-100':
                                    activeMode?.mainMode === ACTION_MODES.PATH,
                            })}
                            onClick={handleClick}
                            ref={buttonRef}
                        >
                            <Brush
                                color={
                                    activeMode?.mainMode === ACTION_MODES.PATH
                                        ? TOOLBAR_COLORS.SELECTED
                                        : TOOLBAR_COLORS.DEFAULT
                                }
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Pen</p>
                    </TooltipContent>
                </Tooltip>
                {isOpen ? (
                    <div className="absolute flex items-center gap-2 bottom-12 left-1/2 -translate-x-1/2 md:flex-col md:bottom-auto md:left-14 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 bg-white shadow-2xl p-1 rounded-lg z-50">
                        {tools.map((tool) => (
                            <Tooltip key={tool.mode}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={clsx(TOOLBAR_BUTTON, {
                                            'bg-sky-100':
                                                activeMode?.subMode ===
                                                tool.mode,
                                        })}
                                        onClick={() =>
                                            handlePathModeChange(tool.mode)
                                        }
                                    >
                                        {tool.icon && (
                                            <tool.icon
                                                color={
                                                    activeMode?.subMode ===
                                                    tool.mode
                                                        ? TOOLBAR_COLORS.SELECTED
                                                        : TOOLBAR_COLORS.DEFAULT
                                                }
                                            />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{tool.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        {activeMode.subMode === SUB_ACTION_MODES.DRAW_PEN ? (
                            <>
                                <div className="w-[0.5px] h-6 bg-zinc-300 md:w-3/5 md:h-[0.2px] md:my-2" />
                                <Tooltip>
                                    <TooltipTrigger>
                                        <ColorButton
                                            color={`rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, ${selectedColor.a})`}
                                            ariaLabel="Color and thickness"
                                            fillPercentage={
                                                (thickness * 100) /
                                                PEN_CONSTANTS.THICKNESS_MAX
                                            }
                                            onClick={colorBtnClickHandler}
                                            size={30}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Color and thickness</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        ) : null}
                    </div>
                ) : null}

                {showColorDropdown &&
                activeMode.subMode === SUB_ACTION_MODES.DRAW_PEN ? (
                    <div className="absolute bottom-24 right-0 md:bottom-auto md:right-auto md:left-28 md:top-1/2 md:-translate-y-1/2">
                        <PenColorDropdown />
                    </div>
                ) : null}
            </>
        </div>
    )
}
