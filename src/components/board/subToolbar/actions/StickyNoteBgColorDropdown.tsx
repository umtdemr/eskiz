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
        rgba: { r: 253, g: 224, b: 71, a: 1 },
        color: 'rgb(253, 224, 71)',
    },
    {
        name: 'Dark Yellow',
        rgba: { r: 234, g: 179, b: 8, a: 1 },
        color: 'rgb(234, 179, 8)',
    },
    {
        name: 'Orange',
        rgba: { r: 251, g: 146, b: 60, a: 1 },
        color: 'rgb(251, 146, 60)',
    },
    {
        name: 'Light Blue',
        rgba: { r: 186, g: 230, b: 253, a: 1 },
        color: 'rgb(186, 230, 253)',
    },
    {
        name: 'Blue',
        rgba: { r: 96, g: 165, b: 250, a: 1 },
        color: 'rgb(96, 165, 250)',
    },
    {
        name: 'Dark Blue',
        rgba: { r: 29, g: 78, b: 216, a: 1 },
        color: 'rgb(29, 78, 216)',
    },
    {
        name: 'Cyan',
        rgba: { r: 103, g: 232, b: 249, a: 1 },
        color: 'rgb(103, 232, 249)',
    },
    {
        name: 'Light Green',
        rgba: { r: 74, g: 222, b: 128, a: 1 },
        color: 'rgb(74, 222, 128)',
    },
    {
        name: 'Green',
        rgba: { r: 22, g: 163, b: 74, a: 1 },
        color: 'rgb(22, 163, 74)',
    },
    {
        name: 'Dark Green',
        rgba: { r: 20, g: 83, b: 45, a: 1 },
        color: 'rgb(20, 83, 45)',
    },
    {
        name: 'Light Rose',
        rgba: { r: 251, g: 113, b: 133, a: 1 },
        color: 'rgb(251, 113, 133)',
    },
    {
        name: 'Rose',
        rgba: { r: 244, g: 63, b: 94, a: 1 },
        color: 'rgb(244, 63, 94)',
    },
    {
        name: 'Dark Rose',
        rgba: { r: 159, g: 18, b: 57, a: 1 },
        color: 'rgb(159, 18, 57)',
    },
    {
        name: 'Gray',
        rgba: { r: 243, g: 244, b: 246, a: 1 },
        color: 'rgb(209, 213, 219)',
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
