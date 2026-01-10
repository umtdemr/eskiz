import { MoveUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Engine } from '@/core/engine/Engine'
import { LineStyleDropdown } from './LineStyleDropdown'
import { useBoundStore } from '@/store/store'

export interface LineStyleInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function LineStyleInput({ id, tooltip, engine }: LineStyleInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'lineStyle'

    return (
        <div className="relative" id={id}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="iconBox"
                        onClick={() => toggleDropdown('lineStyle')}
                        data-active={isActive}
                    >
                        <MoveUpRight />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <LineStyleDropdown engine={engine} />}
        </div>
    )
}
