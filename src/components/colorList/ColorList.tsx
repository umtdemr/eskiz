import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { RGBA } from '@/core/shapes/Color'
import { ColorButton } from '../colorButton/ColorButton'
import { ColorPalette } from './ColorPalette'
import { RgbColor } from 'react-colorful'
import { useShallow } from 'zustand/react/shallow'
import { useBoundStore } from '@/store/store'

export interface ColorListProps {
    onColorSelect: (color: RGBA) => void
}
const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export function ColorList({ onColorSelect }: ColorListProps) {
    const colors = useBoundStore(useShallow((state) => state.colors))
    const addNewColor = useBoundStore((state) => state.addNewColor)

    const onNewColorAdd = (color: RgbColor) => {
        const hexName = rgbToHex(color.r, color.g, color.b)
        addNewColor({
            color: hexName,
            colorKey: hexName,
            rgba: { ...color, a: 1 },
            name: hexName,
            isCustom: true,
        })
    }

    return (
        <>
            <span className="text-xs mb-1 block">Color</span>
            <div className="flex gap-2 flex-wrap">
                <TooltipProvider>
                    {colors.map((color) => (
                        <Tooltip>
                            <TooltipTrigger>
                                <ColorButton
                                    key={color.colorKey}
                                    ariaLabel={`Color ${color.color}`}
                                    color={color.color}
                                    onClick={() => onColorSelect(color.rgba)}
                                    size={28}
                                    showBorder={true}
                                    enableHoverEffect
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{color.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <Tooltip>
                        <TooltipTrigger>
                            <ColorPalette
                                size={28}
                                onAdd={onNewColorAdd}
                                onChange={(color: RgbColor) =>
                                    onColorSelect({ ...color, a: 1 })
                                }
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add a new color</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </>
    )
}
