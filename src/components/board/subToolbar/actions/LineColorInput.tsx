import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { LineColorDropdown } from './LineColorDropdown'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'
import { BgColorIcon } from '@/components/colorButton/BgColorIcon'
import { SelectionService } from '@/core/services/SelectionService'
import { useState } from 'react'
import { Line } from '@/core/shapes/line/Line'

export interface LineColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

function getSelectedStrokeColor(engine: Engine): string | null {
    const selectionService = engine.getService<SelectionService>('selection')
    if (selectionService.selected.length !== 1) return null
    const widget = selectionService.selected[0]

    if (widget instanceof Line) {
        const color = widget.strokeColor
        if (color?.a === 0) return 'rgba(0, 0, 0, 0)'
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    }
    return null
}

export function LineColorInput({ tooltip, id, engine }: LineColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'lineColor'

    const [lineColor, setLineColor] = useState<string | null>(() =>
        getSelectedStrokeColor(engine),
    )

    const handleClick = () => {
        toggleDropdown('lineColor')
    }

    const onColorChange = (colorStr: string) => {
        setLineColor(colorStr)
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
                            <BgColorIcon color={lineColor || 'none'} />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <LineColorDropdown
                    engine={engine}
                    onColorChange={onColorChange}
                />
            )}
        </div>
    )
}
