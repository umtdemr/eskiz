import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hand, MousePointer2, Redo, Square, StickyNote, Type, Undo} from "lucide-react";

export default function Toolbar() {
    return (
        <div className='fixed flex gap-2 flex-col rounded p-2 top-[50%] left-5 bg-white' style={{ transform: 'translateY(-50%)', boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant='ghost' className='px-2'>
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
                        <Button variant='ghost' className='px-2'>
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
                        <Button disabled variant='ghost' className='px-2'>
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