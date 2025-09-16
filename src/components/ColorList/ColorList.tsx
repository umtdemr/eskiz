import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { RGBA } from '@/core/shapes/Color'
import { ColorButton } from '../colorButton/ColorButton'

const colors: {
    ariaLabel: string
    color: string
    colorKey: string
    rgba: RGBA
    name: string
}[] = [
    {
        colorKey: 'black',
        name: 'Black',
        ariaLabel: 'color black',
        color: 'rgba(0, 0, 0, 1)',
        rgba: { r: 0, g: 0, b: 0, a: 1 },
    },
    {
        colorKey: 'zinc',
        name: 'Zinc',
        ariaLabel: 'color zinc',
        color: 'rgba(63, 63, 71, 1)',
        rgba: { r: 63, g: 63, b: 71, a: 1 },
    },
    {
        colorKey: 'red',
        name: 'Red',
        ariaLabel: 'color red',
        color: 'rgba(231, 0, 0, 1)',
        rgba: { r: 231, g: 0, b: 0, a: 1 },
    },
    {
        colorKey: 'orange',
        name: 'Orange',
        ariaLabel: 'color orange',
        color: 'rgba(245, 74, 0, 1)',
        rgba: { r: 245, g: 74, b: 0, a: 1 },
    },
    {
        colorKey: 'green',
        name: 'Green',
        ariaLabel: 'color green',
        color: 'rgba(0, 166, 62, 1)',
        rgba: { r: 0, g: 166, b: 62, a: 1 },
    },
    {
        colorKey: 'teal',
        name: 'Teal',
        ariaLabel: 'color teal',
        color: 'rgba(0, 150, 137, 1)',
        rgba: { r: 0, g: 150, b: 137, a: 1 },
    },
    {
        colorKey: 'blue',
        name: 'Blue',
        ariaLabel: 'color blue',
        color: 'rgba(21, 93, 252, 1)',
        rgba: { r: 21, g: 93, b: 252, a: 1 },
    },
    {
        colorKey: 'indigo',
        name: 'Indigo',
        ariaLabel: 'color indigo',
        color: 'rgba(79, 57, 246, 1)',
        rgba: { r: 79, g: 57, b: 246, a: 1 },
    },
    {
        colorKey: 'purple',
        name: 'Purple',
        ariaLabel: 'color purple',
        color: 'rgba(152, 16, 250, 1)',
        rgba: { r: 152, g: 16, b: 250, a: 1 },
    },
    {
        colorKey: 'pink',
        name: 'Pink',
        ariaLabel: 'color pink',
        color: 'rgba(230, 0, 118, 1)',
        rgba: { r: 230, g: 0, b: 118, a: 1 },
    },
]

export interface ColorListProps {
    onColorSelect: (color: RGBA) => void
}

export function ColorList({ onColorSelect }: ColorListProps) {
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
                                    ariaLabel={color.ariaLabel}
                                    color={color.color}
                                    onClick={() => onColorSelect(color.rgba)}
                                    size={28}
                                    showBorder={false}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{color.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </>
    )
}
