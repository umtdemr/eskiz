import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { TextAlignDropdown } from './TextAlignDropdown'
import { useBoundStore } from '@/store/store'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { useEffect, useState } from 'react'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'
import { TextBox } from '@/core/shapes/text/TextBox'
import { Shape } from '@/core/shapes/Shape'

export interface TextAlignInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function TextAlignInput({ tooltip, id, engine }: TextAlignInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'textAlign'
    const [currentAlign, setCurrentAlign] = useState<TEXT_ALIGN>('left')

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        if (selectionService.selected.length !== 1) {
            return
        }
        const selectedWidget = selectionService.selected[0]

        if (selectedWidget instanceof TextBox) {
            setCurrentAlign(selectedWidget.properties.textAlign || 'left')
        } else if (selectedWidget instanceof Shape) {
            if (selectedWidget.textProperties) {
                setCurrentAlign(
                    selectedWidget.textProperties.textAlign || 'left',
                )
            }
        }
    }, [engine, activeDropdown])

    const handleClick = () => {
        toggleDropdown('textAlign')
    }

    const onTextAlignChange = (newAlign: TEXT_ALIGN) => {
        setCurrentAlign(newAlign)
    }

    const getAlignIcon = () => {
        switch (currentAlign) {
            case 'center':
                return <AlignCenter />
            case 'right':
                return <AlignRight />
            default:
                return <AlignLeft />
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
                            {getAlignIcon()}
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && (
                <TextAlignDropdown
                    engine={engine}
                    onTextAlignChange={onTextAlignChange}
                />
            )}
        </div>
    )
}

