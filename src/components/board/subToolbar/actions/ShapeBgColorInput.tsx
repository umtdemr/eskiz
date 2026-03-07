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
import { useRef, useState } from 'react'
import { ChangeBgColor } from '@/core/command/ChangeBgColor'
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
    const commandRef = useRef(new ChangeBgColor('changeBgColor'))
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'shapeBgColor'

    const [bgColor, setBgColor] = useState<string | null>(() =>
        getSelectedFillColor(engine),
    )

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

        const c = action.color
        setBgColor(`rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`)

        if (action.isImmediate) {
            toggleDropdown('shapeBgColor')
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
                            <BgColorIcon color={bgColor || 'none'} />
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
