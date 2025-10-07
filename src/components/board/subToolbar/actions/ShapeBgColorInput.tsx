import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ShapeBgColorDropdown } from './ShapeBgColorDropdown'

export interface ShapeBgColorInputProps {
    id: string
    tooltip: string
}

export function ShapeBgColorInput({ tooltip, id }: ShapeBgColorInputProps) {
    return (
        <div id={id} className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Button className="iconBox">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-squircle-icon lucide-squircle"
                            >
                                <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                            </svg>
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            <ShapeBgColorDropdown />
        </div>
    )
}
