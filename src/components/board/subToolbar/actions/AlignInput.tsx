import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { AlignStartVertical } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { useBoundStore } from '@/store/store'
import { AlignDropdown } from './AlignDropdown'

export interface AlignInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function AlignInput({ id, tooltip, engine }: AlignInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'align'

    return (
        <div id={id} className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Button
                            className="iconBox"
                            onClick={() => toggleDropdown('align')}
                            data-active={isActive}
                        >
                            <AlignStartVertical />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <AlignDropdown engine={engine} />}
        </div>
    )
}
