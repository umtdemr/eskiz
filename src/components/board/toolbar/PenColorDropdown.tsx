import { useRef } from 'react'
import { Slider } from '@/components/ui/slider'
import { useBoundStore } from '@/store/store'
import { useShallow } from 'zustand/react/shallow'
import { RGBA } from '@/core/shapes/Color'
import { PEN_CONSTANTS } from '@/helpers/Constant'
import { ColorList } from '@/components/ColorList/ColorList'

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
                <ColorList
                    onColorSelect={(color: RGBA) => setPenColor(color)}
                />
            </div>
        </div>
    )
}
