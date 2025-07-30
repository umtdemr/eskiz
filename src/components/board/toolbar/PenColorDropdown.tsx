import { useRef } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { ColorButton } from '@/components/colorButton/ColorButton'
import { Slider } from '@/components/ui/slider'
import { useBoundStore } from '@/store/store'
import { useShallow } from 'zustand/react/shallow'
import { RGBA } from '@/core/shapes/Color'
import { PEN_CONSTANTS } from '@/helpers/Constant'

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

export function PenColorDropdown() {
    const thicknessUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    )
    const thickness = useBoundStore(useShallow((state) => state.pen.thickness))
    const setThickness = useBoundStore((state) => state.changePenThickness)
    const setPenColor = useBoundStore((state) => state.changePenColor)

    const onThicknessValueChange = (number: number[]) => {
        clearTimeout(thicknessUpdateTimeout.current!)
        thicknessUpdateTimeout.current = setTimeout(() => {
            setThickness(number[0])
        }, 200)
    }

    return (
        <div className="relative w-48 bg-white p-2 rounded-xl shadow-xl flex flex-col gap-6">
            <div>
                <span className="text-xs mb-1 block">Thickness</span>
                <Slider
                    defaultValue={[thickness]}
                    max={PEN_CONSTANTS.THICKNESS_MAX}
                    step={PEN_CONSTANTS.THICKNESS_STEP}
                    min={PEN_CONSTANTS.THICKNESS_MIN}
                    onValueChange={onThicknessValueChange}
                />
            </div>
            <div>
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
                                        onClick={() => setPenColor(color.rgba)}
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
            </div>
        </div>
    )
}
