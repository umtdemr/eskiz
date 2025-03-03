import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Hand, MousePointer2, Redo, StickyNote, Type, Undo} from "lucide-react";
import {useCallback} from "react";
import {clsx} from "clsx";
import {ShapesDropdown} from "@/components/board/toolbar/ShapesDropdown.tsx";
import { useBoundStore } from "@/store/store";
import { useShallow } from "zustand/react/shallow";
import { ACTION_MODES, SUB_ACTION_MODES } from "@/helpers/Constant";

export default function Toolbar() {
    const activeMode = {
        mainMode: useBoundStore(useShallow((state) => state.mainMode)),
        subMode: useBoundStore(useShallow((state) => state.subMode))
    }

    const changeActiveMode = useBoundStore(useShallow((state) => state.changeActiveMode))

    const handleShapeModeChange = useCallback((newMode: keyof typeof SUB_ACTION_MODES) => {
        changeActiveMode(ACTION_MODES.CREATE, newMode)
    }, [changeActiveMode])
    
    return (
        <div className='fixed flex gap-2 flex-col rounded p-2 top-[50%] left-5 bg-white' style={{ transform: 'translateY(-50%)', boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant='ghost' 
                            className={clsx('px-2', { 
                                'bg-amber-500': activeMode?.mainMode === ACTION_MODES.SELECT,
                                'hover:bg-amber-500': activeMode?.mainMode === ACTION_MODES.SELECT
                            })} 
                            onClick={() => changeActiveMode(ACTION_MODES.SELECT)}>
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
                                'bg-amber-500': activeMode?.mainMode === ACTION_MODES.PAN,
                                'hover:bg-amber-500': activeMode?.mainMode === ACTION_MODES.PAN
                            })}
                            onClick={() => changeActiveMode(ACTION_MODES.PAN)}>
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