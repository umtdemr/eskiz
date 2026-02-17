import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Link } from 'react-router-dom'

export default function SkeletonHeader() {
    return (
        <>
            <div className="fixed top-5 left-5" id="header_left">
                <div className="flex px-5 py-1 rounded-lg gap-2 items-center select-none bg-white shadow">
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                asChild
                                size="sm"
                                className="text-base font-bold"
                            >
                                <Link to={'/boards'}>WB</Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={10}>
                            Home
                        </TooltipContent>
                    </Tooltip>
                    <div className="block w-[0.5px] h-full bg-zinc-300"></div>
                    <Skeleton className="w-[98.38px] py-2" />
                </div>
            </div>
            <div className="fixed top-5 right-5 flex bg-white shadow px-2 py-2 rounded-xl h-12 items-center gap-2">
                <Skeleton className="w-32 py-4" />
            </div>
        </>
    )
}
