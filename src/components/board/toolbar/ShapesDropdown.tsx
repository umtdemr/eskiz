import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {clsx} from "clsx";
import {Shapes, Square, Triangle} from "lucide-react";
import {CanvasMode, CanvasSubModes} from "@/core/canvas/Canvas.ts";
import {ComponentType, SVGAttributes} from "react";

export function ShapesDropdown({
    activeMode, 
    handleShapeModeChange
}: {
    activeMode: CanvasMode,
    handleShapeModeChange: (newMode: CanvasSubModes) => void
}) {
    
    const shapes: {tooltip: string, mode: CanvasSubModes, icon?: ComponentType<SVGAttributes<SVGElement>> }[] = [
        {
            tooltip: 'Rectangle',
            mode: 'createRectangle',
            icon: Square
        },
        {
            tooltip: 'Triangle',
            mode: 'createRectangle',
            icon: Triangle
        },
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='ghost'
                                className={clsx('px-2', {
                                    'bg-amber-500': activeMode?.subMode === 'createRectangle',
                                    'hover:bg-amber-500': activeMode?.subMode === 'createRectangle'
                                })}
                                onClick={() => {
                                    // canvas.changeActiveMode('create', 'createRectangle')
                                }}
                            >
                                <Shapes />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side={'right'}>
                            <p>Shapes</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side={'right'}
                sideOffset={20}
                className='min-w-0'
            >
                <div className={'flex'}>
                    {shapes.map(shape => (
                        <DropdownMenuItem 
                            className={clsx('p-1', {
                                
                            })}
                            onClick={() => handleShapeModeChange(shape.mode)}
                        >
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant='ghost' className='px-2'>
                                            {shape.icon && <shape.icon />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{shape.tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}