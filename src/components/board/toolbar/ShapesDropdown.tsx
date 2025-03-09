import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {clsx} from "clsx";
import {Circle, Shapes, Square, Triangle} from "lucide-react";
import {ComponentType, SVGAttributes, useEffect, useRef, useState} from "react";
import useOnClickOutside from "@/hooks/UseOutsideClick.ts";
import { ACTION_MODES, SUB_ACTION_MODES } from "@/helpers/Constant";

function isSubModeForShapes(mode: keyof typeof SUB_ACTION_MODES | undefined): boolean {
    if (!mode) return false
    return mode === SUB_ACTION_MODES.CREATE_RECTANGLE || 
        mode === SUB_ACTION_MODES.CREATE_ELLIPSE || 
        mode === SUB_ACTION_MODES.CREATE_TRIANGLE
}

export function ShapesDropdown({
    activeMode, 
    handleShapeModeChange
}: {
    activeMode: { mainMode: keyof typeof ACTION_MODES, subMode?: keyof typeof SUB_ACTION_MODES },
    handleShapeModeChange: (newMode: keyof typeof SUB_ACTION_MODES) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const shapesBtnRef = useRef<HTMLButtonElement>(null)
    
    const onClickOutsideHandler = (event: MouseEvent) => {
        if (shapesBtnRef.current!.contains(event.target as Node)) {
            return
        }
        setIsOpen(false)
    }
    useOnClickOutside(menuRef, onClickOutsideHandler)

    const shapes: {tooltip: string, mode: keyof typeof SUB_ACTION_MODES, icon?: ComponentType<SVGAttributes<SVGElement>> }[] = [
        {
            tooltip: 'Rectangle',
            mode: SUB_ACTION_MODES.CREATE_RECTANGLE,
            icon: Square
        },
        {
            tooltip: 'Triangle',
            mode: SUB_ACTION_MODES.CREATE_TRIANGLE,
            icon: Triangle
        },
        {
            tooltip: 'Ellipse',
            mode: SUB_ACTION_MODES.CREATE_ELLIPSE,
            icon: Circle
        },
    ]
    
    const toggleVisibility = () => {
        setIsOpen(oldState => !oldState)
    }

    useEffect(() => {
        if (isOpen) {
            handleShapeModeChange(SUB_ACTION_MODES.CREATE_RECTANGLE)
        }
    }, [isOpen, handleShapeModeChange]);

    return (
        <div className='relative'>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            className={clsx('px-2', {
                                'bg-amber-500': isSubModeForShapes(activeMode?.subMode),
                                'hover:bg-amber-500': (activeMode?.subMode)
                            })}
                            onClick={toggleVisibility}
                            ref={shapesBtnRef}
                        >
                            <Shapes />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Shapes</p>
                    </TooltipContent>
                </Tooltip>
            {
                isOpen ? (
                    <div
                        className='absolute flex gap-2 left-14 top-0 bg-white shadow-2xl p-1 rounded-lg z-50'
                        ref={menuRef}
                    >
                        {shapes.map(shape => (
                            <Tooltip key={shape.mode}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant='ghost' 
                                        className={clsx('px-2', {
                                            'bg-amber-500': activeMode?.subMode === shape.mode,
                                            'hover:bg-amber-500': activeMode?.subMode === shape.mode
                                        })}
                                        onClick={() => handleShapeModeChange(shape.mode)}
                                    >
                                        {shape.icon && <shape.icon />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{shape.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                ) : null
            }
            </TooltipProvider>
        </div>
    )
}