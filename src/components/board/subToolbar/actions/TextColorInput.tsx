import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { TextColorDropdown } from './TextColorDropdown'
import { useBoundStore } from '@/store/store'
import { Baseline } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'

export interface TextColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function TextColorInput({ tooltip, id, engine }: TextColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'textColor'

    const handleClick = () => {
        toggleDropdown('textColor')
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
                            <Baseline />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <TextColorDropdown
                    engine={engine}
                    closeDropdown={() => toggleDropdown('textColor')}
                />
            )}
        </div>
    )
}

