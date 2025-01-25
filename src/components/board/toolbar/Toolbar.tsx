import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hand, MousePointer2, Redo, StickyNote, Type, Undo} from "lucide-react";
import {useCallback, useEffect, useState} from "react";
import {clsx} from "clsx";
import {ShapesDropdown} from "@/components/board/toolbar/ShapesDropdown.tsx";
import {Engine, CanvasMode, CanvasSubModes} from "@/core/engine/Engine.ts";

export default function Toolbar({
    engine
}: {
    engine: Engine
}) {
    const [activeMode, setActiveMode] = useState<CanvasMode>({ mainMode: 'neutral' })
    
    const handleShapeModeChange = useCallback((newMode: CanvasSubModes) => {
        engine.changeActiveMode('create', newMode)
    }, [engine])
    
    useEffect(() => {
        const unsubscribe = engine.on('modeChange', (event) => {
            setActiveMode(event)
        })
        
        return () => unsubscribe();
    })
    
    return (
        <div className='fixed flex gap-2 flex-col rounded p-2 top-[50%] left-5 bg-white' style={{ transform: 'translateY(-50%)', boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant='ghost' 
                            className={clsx('px-2', { 
                                'bg-amber-500': activeMode?.mainMode === 'neutral',
                                'hover:bg-amber-500': activeMode?.mainMode === 'neutral'
                            })} 
                            onClick={() => engine.changeActiveMode('neutral')}>
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
                            variant='ghost' 
                            className={clsx('px-2', {
                                'bg-amber-500': activeMode?.mainMode === 'pan',
                                'hover:bg-amber-500': activeMode?.mainMode === 'pan'
                            })}
                            onClick={() => engine.changeActiveMode('pan')}>
                            <Hand />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Pan</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className='w-full h-[0.5px] bg-zinc-400 my-5' />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button disabled variant='ghost' className='px-2'>
                            <Type />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Text</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <ShapesDropdown activeMode={activeMode} handleShapeModeChange={handleShapeModeChange} />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button disabled variant='ghost' className='px-2'>
                            <StickyNote />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Sticky note</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className='w-full h-[0.5px] bg-zinc-400 my-5' />
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button disabled variant='ghost' className='px-2'>
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
                        <Button disabled variant='ghost' className='px-2'>
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