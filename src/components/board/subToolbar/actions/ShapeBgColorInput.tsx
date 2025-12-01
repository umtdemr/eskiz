import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ShapeBgColorDropdown } from './ShapeBgColorDropdown'
import { useBoundStore } from '@/store/store'
import { RGBA } from '@/core/shapes/Color'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { CommandCtx } from '@/core/command/Command'
import { useRef } from 'react'
import { ChangeBgColor } from '@/core/command/ChangeBgColor'

export interface ShapeBgColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function ShapeBgColorInput({
    tooltip,
    id,
    engine,
}: ShapeBgColorInputProps) {
    const commandRef = useRef(new ChangeBgColor('changeBgColor'))
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'shapeBgColor'

    const handleClick = () => {
        toggleDropdown('shapeBgColor')
    }

    const onColorSelect = (action: { color: RGBA; isImmediate: boolean }) => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: !action.isImmediate,
            params: {
                color: action.color,
            },
        }
        commandRef.current?.execute(ctx)
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
            {isActive && (
                <ShapeBgColorDropdown
                    onColorSelect={onColorSelect}
                    engine={engine}
                />
            )}
        </div>
    )
}
