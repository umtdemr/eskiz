import './ShapeBorderColorDropdown.scss'
import { Slider } from '@/components/ui/slider'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { useEffect, useState } from 'react'
import { RGBA } from '@/core/shapes/Color'

export interface ShapeBgColorDropdownProps {
    onColorSelect: (signature: ColorSelectSignature) => void
    engine: Engine
}

export function ShapeBgColorDropdown({
    onColorSelect,
    engine,
}: ShapeBgColorDropdownProps) {
    const [showOpacity, setShowOpacity] = useState(true)
    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        if (selectionService.selected.length !== 1) {
            return
        }
        const selectedWidget = selectionService.selected[0]
        if (selectedWidget.widgetType !== 'shape') {
            return
        }
        const color = selectedWidget.properties.fillColor as RGBA

        if (color.a === 0 && color.r === 0 && color.g === 0 && color.b === 0) {
            setShowOpacity(false)
        } else {
            setOpacity(color.a)
        }
    }, [engine])

    const handleOpacityChange = (newOpacityArr: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        if (selectionService.selected.length !== 1) return

        const selected = selectionService.selected[0]
        const newOpacity = newOpacityArr[0]
        setOpacity(newOpacity)

        const color = {
            ...(selected.properties.fillColor as RGBA),
            a: newOpacity,
        } as RGBA

        onColorSelect({
            color,
            isImmediate: false,
            rgba: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
        })
    }

    const onColorSelectWrapper = (signature: ColorSelectSignature) => {
        const color = signature.color
        if (color.a === 0 && color.r === 0 && color.g === 0 && color.b === 0) {
            setShowOpacity(false)
            onColorSelect(signature)
            return
        }

        setShowOpacity(true)

        onColorSelect({
            color: { ...signature.color, a: opacity },
            isImmediate: signature.isImmediate,
            rgba: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
        })
    }

    return (
        <div className="shape_border_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            {showOpacity && (
                <div className="p-2">
                    <span className="text-xs mb-1 block">Opacity</span>
                    <Slider
                        value={[opacity]}
                        max={1}
                        step={0.1}
                        min={0.1}
                        onValueChange={handleOpacityChange}
                    />
                </div>
            )}
            <div className="p-2">
                <ColorList onColorSelect={onColorSelectWrapper} perColumn={4} />
            </div>
        </div>
    )
}
