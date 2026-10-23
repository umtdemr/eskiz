import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Button } from '@/components/ui/button.tsx'
import { clsx } from 'clsx'
import { Circle, Shapes, Square, Triangle } from 'lucide-react'
import { ComponentType, SVGAttributes, useRef, useState } from 'react'
import useOnClickOutside from '@/hooks/UseOutsideClick.ts'
import useToolShortcut from '@/hooks/UseToolShortcut'
import { Engine } from '@/core/engine/Engine'
import {
    ACTION_MODES,
    SUB_ACTION_MODES,
    TOOLBAR_BUTTON,
    TOOLBAR_COLORS,
} from '@/helpers/Constant'

function isSubModeForShapes(
    mode: keyof typeof SUB_ACTION_MODES | undefined,
): boolean {
    if (!mode) return false
    return (
        mode === SUB_ACTION_MODES.CREATE_RECTANGLE ||
        mode === SUB_ACTION_MODES.CREATE_ELLIPSE ||
        mode === SUB_ACTION_MODES.CREATE_TRIANGLE
    )
}

export function ShapesDropdown({
    engine,
    activeMode,
    handleShapeModeChange,
}: {
    engine: Engine
    activeMode: {
        mainMode: keyof typeof ACTION_MODES
        subMode?: keyof typeof SUB_ACTION_MODES
    }
    handleShapeModeChange: (newMode: keyof typeof SUB_ACTION_MODES) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)
    const shapesBtnRef = useRef<HTMLButtonElement>(null)

    const onClickOutsideHandler = (event: Event) => {
        if (shapesBtnRef.current!.contains(event.target as Node)) {
            return
        }
        setIsOpen(false)
    }
    useOnClickOutside(menuRef, onClickOutsideHandler, isOpen)
    useToolShortcut(engine, ACTION_MODES.CREATE, setIsOpen)

    const shapes: {
        tooltip: string
        mode: keyof typeof SUB_ACTION_MODES
        icon?: ComponentType<SVGAttributes<SVGElement>>
    }[] = [
        {
            tooltip: 'Rectangle',
            mode: SUB_ACTION_MODES.CREATE_RECTANGLE,
            icon: Square,
        },
        {
            tooltip: 'Triangle',
            mode: SUB_ACTION_MODES.CREATE_TRIANGLE,
            icon: Triangle,
        },
        {
            tooltip: 'Ellipse',
            mode: SUB_ACTION_MODES.CREATE_ELLIPSE,
            icon: Circle,
        },
    ]

    const toggleVisibility = () => {
        setIsOpen((oldState) => !oldState)
        // keep the shape picked by a shortcut
        if (isSubModeForShapes(activeMode.subMode)) return
        handleShapeModeChange(SUB_ACTION_MODES.CREATE_RECTANGLE)
    }

    return (
        <div className="relative">
            <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx(TOOLBAR_BUTTON, 'relative', {
                                'bg-sky-100': isSubModeForShapes(
                                    activeMode?.subMode,
                                ),
                            })}
                            onClick={toggleVisibility}
                            ref={shapesBtnRef}
                        >
                            <Shapes
                                color={
                                    isSubModeForShapes(activeMode?.subMode)
                                        ? TOOLBAR_COLORS.SELECTED
                                        : TOOLBAR_COLORS.DEFAULT
                                }
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Shapes</p>
                    </TooltipContent>
                </Tooltip>
                {isOpen ? (
                    <div
                        className="absolute flex gap-2 bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:left-14 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 bg-white shadow-2xl p-1 rounded-lg z-50"
                        ref={menuRef}
                    >
                        {shapes.map((shape) => (
                            <Tooltip key={shape.mode}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={clsx(TOOLBAR_BUTTON, {
                                            'bg-sky-100':
                                                activeMode?.subMode ===
                                                shape.mode,
                                        })}
                                        onClick={() =>
                                            handleShapeModeChange(shape.mode)
                                        }
                                    >
                                        {shape.icon && (
                                            <shape.icon
                                                color={
                                                    activeMode?.subMode ===
                                                    shape.mode
                                                        ? TOOLBAR_COLORS.SELECTED
                                                        : TOOLBAR_COLORS.DEFAULT
                                                }
                                            />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{shape.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                ) : null}
            </>
        </div>
    )
}
