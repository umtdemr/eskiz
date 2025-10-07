import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { TextAlignDropdown } from './TextAlignDropdown'
import { useBoundStore } from '@/store/store'
import { AlignLeft } from 'lucide-react'

export interface TextAlignInputProps {
    id: string
    tooltip: string
}

export function TextAlignInput({
    tooltip,
    id,
}: TextAlignInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'textAlign'

    const handleClick = () => {
        toggleDropdown('textAlign')
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
                            <AlignLeft />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <TextAlignDropdown />}
        </div>
    )
}