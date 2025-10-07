import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { FontStyleDropdown } from './FontStyleDropdown'
import { useBoundStore } from '@/store/store'
import { WholeWord } from 'lucide-react'

export interface FontStyleInputProps {
    id: string
    tooltip: string
}

export function FontStyleInput({
    tooltip,
    id,
}: FontStyleInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'fontStyle'

    const handleClick = () => {
        toggleDropdown('fontStyle')
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
                            <WholeWord />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <FontStyleDropdown />}
        </div>
    )
}