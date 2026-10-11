import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { StickyNoteBgColorDropdown } from './StickyNoteBgColorDropdown'
import { useBoundStore } from '@/store/store'
import { RGBA } from '@/core/shapes/Color'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { CommandCtx } from '@/core/command/Command'
import { useState } from 'react'
import { StickyNote } from '@/core/shapes/stickyNote/StickyNote'

export interface StickyNoteBgColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

function getSelectedFillColor(engine: Engine): string | null {
    const selectionService = engine.getService<SelectionService>('selection')
    if (selectionService.selected.length !== 1) return null
    const widget = selectionService.selected[0]
    if (widget instanceof StickyNote) {
        const color = widget.properties.fillColor as RGBA
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    }
    return null
}

export function StickyNoteBgColorInput({
    tooltip,
    id,
    engine,
}: StickyNoteBgColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'stickyNoteBgColor'

    const [fillColor, setFillColor] = useState<string | null>(() =>
        getSelectedFillColor(engine),
    )

    const handleClick = () => {
        toggleDropdown('stickyNoteBgColor')
    }

    const onColorSelect = (color: RGBA) => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: false,
            params: {
                color,
            },
        }
        engine.getCommand('changeBgColor').execute(ctx)
        setFillColor(`rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)
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
                                fill={fillColor || 'none'}
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
                <StickyNoteBgColorDropdown onColorSelect={onColorSelect} />
            )}
        </div>
    )
}
