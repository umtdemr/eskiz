import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { HighlightColorDropdown } from './HighlightColorDropdown'
import { useBoundStore } from '@/store/store'
import { Highlighter } from 'lucide-react'

export interface HighlightColorInputProps {
    id: string
    tooltip: string
}

export function HighlightColorInput({
    tooltip,
    id,
}: HighlightColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'highlightColor'

    const handleClick = () => {
        toggleDropdown('highlightColor')
    }

    return (
        <div id={id} className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Button 
                            className="iconBox"
                            onClick={handleClick}
                            data-active={isActive}
                        >
                            <Highlighter />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <HighlightColorDropdown />}
        </div>
    )
}