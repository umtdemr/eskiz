import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hand, MousePointer2, Redo, Square, StickyNote, Type, Undo} from "lucide-react";
import {Canvas, CanvasMode} from "@/core/canvas/Canvas.ts";
import {useEffect, useState} from "react";
import {clsx} from "clsx";

export default function Toolbar({
    canvas
}: {
    canvas: Canvas
}) {
    const [activeMode, setActiveMode] = useState<CanvasMode>({ mainMode: 'neutral' })
    
    useEffect(() => {
        const unsubscribe = canvas.on('modeChange', (event) => {
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
                            onClick={() => canvas.changeActiveMode('neutral')}>
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
                            onClick={() => canvas.changeActiveMode('pan')}>
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
                                canvas.changeActiveMode('create', 'createRectangle')
                            }}
                        >
                            <Square />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side={'right'}>
                        <p>Rectangle</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
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