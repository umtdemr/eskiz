import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ShapeBorderColorDropdown } from './ShapeBorderColorDropdown'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'
import { StrokeColorIcon } from '@/components/colorButton/StrokeColorIcon'
import { SelectionService } from '@/core/services/SelectionService'
import { RGBA } from '@/core/shapes/Color'
import { useState } from 'react'

export interface ShapeBorderColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

function getSelectedStrokeColor(engine: Engine): string | null {
    const selectionService = engine.getService<SelectionService>('selection')
    if (selectionService.selected.length !== 1) return null
    const widget = selectionService.selected[0]

    if (widget.widgetType === 'path') {
        const color = widget.properties.color as RGBA
        if (color) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
        }
        return null
    }

    if (widget.widgetType === 'shape') {
        const color = widget.properties.strokeColor as RGBA
        if (color) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
        }
    }

    return null
}

export function ShapeBorderColorInput({
    tooltip,
    id,
    engine,
}: ShapeBorderColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'shapeBorderColor'

    const [borderColor, setBorderColor] = useState<string | null>(() =>
        getSelectedStrokeColor(engine),
    )

    const handleClick = () => {
        toggleDropdown('shapeBorderColor')
    }

    const onColorChange = (colorStr: string, isImmediate: boolean = false) => {
        setBorderColor(colorStr)
        if (isImmediate) {
            toggleDropdown('shapeBorderColor')
        }
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
                            <StrokeColorIcon
                                color={borderColor || 'rgba(0, 0, 0, 1)'}
                            />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <ShapeBorderColorDropdown
                    engine={engine}
                    onColorChange={onColorChange}
                />
            )}
        </div>
    )
}
