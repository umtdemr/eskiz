import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { HighlightColorDropdown } from './HighlightColorDropdown'
import { useBoundStore } from '@/store/store'
import { Highlighter } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'

export interface HighlightColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function HighlightColorInput({
    tooltip,
    id,
    engine,
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
            {isActive && <HighlightColorDropdown engine={engine} />}
        </div>
    )
}