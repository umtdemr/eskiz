import toast from 'react-hot-toast'
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

export interface ColorSelectSignature {
    color: RGBA
    isImmediate: boolean
}

export interface ColorListProps {
    onColorSelect: ({ color, isImmediate }: ColorSelectSignature) => void
    perColumn?: number
}
const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export function ColorList({ onColorSelect, perColumn = 4 }: ColorListProps) {
    const colors = useBoundStore(useShallow((state) => state.colors))
    const addNewColor = useBoundStore((state) => state.addNewColor)
    const removeColor = useBoundStore((state) => state.removeColor)

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

    const handleRightClick = (e: React.MouseEvent, color: string) => {
        e.preventDefault()

        // if color is a default color
        if (!color.startsWith('#')) {
            toast.error("sorry, you can't delete default color", {
                id: 'color_palette_default_color_deletion',
            })
            return
        }

        removeColor(color)
    }

    return (
        <>
            <span className="text-xs mb-1 block">Color</span>
            <div
                className="grid gap-2 flex-wrap"
                style={{ gridTemplateColumns: `repeat(${perColumn}, 1fr)` }}
            >
                <TooltipProvider>
                    {colors.map((color) => (
                        <Tooltip key={color.colorKey}>
                            <TooltipTrigger className="flex justify-center">
                                <ColorButton
                                    key={color.colorKey}
                                    ariaLabel={`Color ${color.color}`}
                                    color={color.color}
                                    onClick={() =>
                                        onColorSelect({
                                            color: color.rgba,
                                            isImmediate: true, // immediate action
                                        })
                                    }
                                    size={28}
                                    showBorder={true}
                                    enableHoverEffect
                                    onRightClick={handleRightClick}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{color.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <Tooltip>
                        <TooltipTrigger className="flex justify-center">
                            <ColorPalette
                                size={28}
                                onAdd={onNewColorAdd}
                                onChange={
                                    (color: RgbColor) =>
                                        onColorSelect({
                                            color: { ...color, a: 1 },
                                            isImmediate: false,
                                        }) // continuous action
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
