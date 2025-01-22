import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {clsx} from "clsx";
import {Circle, Shapes, Square, Triangle} from "lucide-react";
import {CanvasMode, CanvasSubModes} from "@/core/canvas/Canvas.ts";
import {ComponentType, SVGAttributes, useEffect, useRef, useState} from "react";
import useOnClickOutside from "@/hooks/UseOutsideClick.ts";

function isSubModeForShapes(mode: CanvasSubModes|undefined): boolean {
    if (!mode) return false
    return mode === 'createRectangle' || mode === 'createTriangle' || mode === 'createEllipse';
}

export function ShapesDropdown({
    activeMode, 
    handleShapeModeChange
}: {
    activeMode: CanvasMode,
    handleShapeModeChange: (newMode: CanvasSubModes) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const shapesBtnRef = useRef(null)
    
    const onClickOutsideHandler = (event) => {
        if (shapesBtnRef.current.contains(event.target)) {
            return
        }
        setIsOpen(false)
    }
    useOnClickOutside(menuRef, onClickOutsideHandler)

    const shapes: {tooltip: string, mode: CanvasSubModes, icon?: ComponentType<SVGAttributes<SVGElement>> }[] = [
        {
            tooltip: 'Rectangle',
            mode: 'createRectangle',
            icon: Square
        },
        {
            tooltip: 'Triangle',
            mode: 'createTriangle',
            icon: Triangle
        },
        {
            tooltip: 'Ellipse',
            mode: 'createEllipse',
            icon: Circle
        },
    ]
    
    const toggleVisibility = () => {
        setIsOpen(oldState => !oldState)
    }

    useEffect(() => {
        if (isOpen) {
            handleShapeModeChange('createRectangle')
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
                            <Tooltip>
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