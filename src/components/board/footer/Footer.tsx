import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Minus, Plus, ZoomIn} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Engine} from "@/core/engine/Engine.ts";

export default function Footer({
    engine
}: { engine: Engine }) {
    const [zoom, setZoom] = useState(100);
    
    useEffect(() => {
        const unsubscribe = engine.on('zoom', (val) => {
            setZoom(Math.floor(val * 100))
        })
        
        return () => unsubscribe()
    }, [])
    
    return (
        <div className='fixed flex gap-1 bottom-5 right-5 px-2 py-1 bg-white' style={{ boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button variant='ghost' className='px-2 py-1'>
                            <Minus />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'top'}>
                        <p>Zoom out</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant='ghost' className='px-2 py-1 w-11'>
                                    {zoom}% 
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side={'top'}>
                                <p>Zoom and navigation</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={20} side={"top"}>
                    <DropdownMenuItem onClick={() => engine.setZoom(0.5)}>
                        <ZoomIn /> 50%
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => engine.setZoom(1)}>
                        <ZoomIn /> 100%
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => engine.setZoom(2)}>
                        <ZoomIn /> 200%
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button variant='ghost' className='px-2 py-1'>
                            <Plus />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'top'}>
                        <p>Zoom in</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}