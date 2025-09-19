import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export interface ShapeBorderColorInputProps {
    id: string
    tooltip: string
}

export function ShapeBorderColorInput({
    tooltip,
    id,
}: ShapeBorderColorInputProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div id={id}>
                    <Button className="iconBox">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-squircle-icon lucide-squircle"
                        >
                            <path
                                d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                                stroke="rgba(0, 0, 0, .1)"
                            />
                        </svg>
                    </Button>
                </div>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    )
}
