import { RGBA } from '@/core/shapes/Color'
import { ColorButton } from '@/components/colorButton/ColorButton'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DEFAULT_FILL_COLOR } from '@/core/shapes/stickyNote/StickyNote'

interface StickyNoteColor {
    name: string
    rgba: RGBA
    color: string
}

export const STICKY_NOTE_COLORS: StickyNoteColor[] = [
    {
        name: 'Light Yellow',
        rgba: { ...DEFAULT_FILL_COLOR },
        color: `rgb(${DEFAULT_FILL_COLOR.r}, ${DEFAULT_FILL_COLOR.g}, ${DEFAULT_FILL_COLOR.b})`,
    },
    {
        name: 'Yellow',
        rgba: { r: 254, g: 240, b: 138, a: 1 }, // yellow-200
        color: 'rgb(254, 240, 138)',
    },
    {
        name: 'Dark Yellow',
        rgba: { r: 253, g: 230, b: 138, a: 1 }, // amber-200
        color: 'rgb(253, 230, 138)',
    },
    {
        name: 'Orange',
        rgba: { r: 254, g: 215, b: 170, a: 1 }, // orange-200
        color: 'rgb(254, 215, 170)',
    },
    {
        name: 'Light Blue',
        rgba: { r: 224, g: 242, b: 254, a: 1 }, // sky-100
        color: 'rgb(224, 242, 254)',
    },
    {
        name: 'Blue',
        rgba: { r: 186, g: 230, b: 253, a: 1 }, // sky-200
        color: 'rgb(186, 230, 253)',
    },
    {
        name: 'Dark Blue',
        rgba: { r: 147, g: 197, b: 253, a: 1 }, // blue-300
        color: 'rgb(147, 197, 253)',
    },
    {
        name: 'Cyan',
        rgba: { r: 165, g: 243, b: 252, a: 1 }, // cyan-200
        color: 'rgb(165, 243, 252)',
    },
    {
        name: 'Light Green',
        rgba: { r: 187, g: 247, b: 208, a: 1 }, // green-200
        color: 'rgb(187, 247, 208)',
    },
    {
        name: 'Green',
        rgba: { r: 134, g: 239, b: 172, a: 1 }, // green-300
        color: 'rgb(134, 239, 172)',
    },
    {
        name: 'Dark Green',
        rgba: { r: 110, g: 231, b: 183, a: 1 }, // emerald-300
        color: 'rgb(110, 231, 183)',
    },
    {
        name: 'Light Rose',
        rgba: { r: 254, g: 205, b: 211, a: 1 }, // rose-200
        color: 'rgb(254, 205, 211)',
    },
    {
        name: 'Rose',
        rgba: { r: 253, g: 164, b: 175, a: 1 }, // rose-300
        color: 'rgb(253, 164, 175)',
    },
    {
        name: 'Dark Rose',
        rgba: { r: 251, g: 113, b: 133, a: 1 }, // rose-400
        color: 'rgb(251, 113, 133)',
    },
    {
        name: 'Gray',
        rgba: { r: 243, g: 244, b: 246, a: 1 }, // gray-100
        color: 'rgb(243, 244, 246)',
    },
    {
        name: 'Black',
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        color: 'rgb(0, 0, 0)',
    },
]

export interface StickyNoteBgColorDropdownProps {
    onColorSelect: (color: RGBA) => void
}

export function StickyNoteBgColorDropdown({
    onColorSelect,
}: StickyNoteBgColorDropdownProps) {
    return (
        <div className="absolute bg-white py-2 px-2 top-[60px] left-[50%] shadow-l -translate-x-1/2 rounded-xl shadow-xs select-none w-[200px]">
            <div className="grid grid-cols-4 gap-2 p-1">
                <TooltipProvider>
                    {STICKY_NOTE_COLORS.map((color) => (
                        <Tooltip key={color.name}>
                            <TooltipTrigger className="flex justify-center">
                                <ColorButton
                                    ariaLabel={`Sticky note ${color.name}`}
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
                </TooltipProvider>
            </div>
        </div>
    )
}
