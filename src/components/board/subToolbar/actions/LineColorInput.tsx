import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { LineColorDropdown } from './LineColorDropdown'
import { useBoundStore } from '@/store/store'
import { Palette } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'

export interface LineColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function LineColorInput({ tooltip, id, engine }: LineColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'lineColor'

    const handleClick = () => {
        toggleDropdown('lineColor')
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
                            <Palette />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <LineColorDropdown
                    engine={engine}
                    closeDropdown={() => toggleDropdown('lineColor')}
                />
            )}
        </div>
    )
}
