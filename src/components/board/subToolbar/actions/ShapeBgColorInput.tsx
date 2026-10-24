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
import { useState } from 'react'
import { BgColorIcon } from '@/components/colorButton/BgColorIcon'

export interface ShapeBgColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

function getSelectedFillColor(engine: Engine): string | null {
    const selectionService = engine.getService<SelectionService>('selection')
    if (selectionService.selected.length !== 1) return null
    const widget = selectionService.selected[0]

    if (widget.properties && 'fillColor' in widget.properties) {
        const color = widget.properties.fillColor as RGBA
        if (color) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
        }
    }
    return null
}

export function ShapeBgColorInput({
    tooltip,
    id,
    engine,
}: ShapeBgColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'shapeBgColor'

    const [bgColor, setBgColor] = useState<string | null>(() =>
        getSelectedFillColor(engine),
    )

    const handleClick = () => {
        toggleDropdown('shapeBgColor')
    }

    const onColorSelect = (action: { color: RGBA; isImmediate: boolean }) => {
        engine.execute(
            'changeBgColor',
            { color: action.color },
            { continuous: !action.isImmediate },
        )

        const c = action.color
        setBgColor(`rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`)

        if (action.isImmediate) {
            toggleDropdown('shapeBgColor')
        }
    }

    const onOpacityChange = (opacity: number) => {
        engine.execute('changeBgColor', { opacity }, { continuous: true })
        setBgColor(getSelectedFillColor(engine))
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
                            <BgColorIcon color={bgColor || 'none'} />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <ShapeBgColorDropdown
                    onColorSelect={onColorSelect}
                    onOpacityChange={onOpacityChange}
                    engine={engine}
                />
            )}
        </div>
    )
}
