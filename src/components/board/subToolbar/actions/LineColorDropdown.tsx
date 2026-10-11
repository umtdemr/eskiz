import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'

export interface LineColorDropdownProps {
    engine: Engine
    onColorChange: (colorStr: string) => void
}

export function LineColorDropdown({
    engine,
    onColorChange,
}: LineColorDropdownProps) {
    const handleColorSelect = (signature: ColorSelectSignature) => {
        const color = { ...signature.color, a: 1 }

        const executed = engine.execute(
            'changeBorderColor',
            { color },
            { continuous: !signature.isImmediate },
        )
        if (!executed) return

        onColorChange(`rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`)
    }

    return (
        <div className="absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-xl -translate-x-1/2 w-[200px] rounded-xl select-none z-50">
            <div className="p-2">
                <ColorList
                    onColorSelect={handleColorSelect}
                    perColumn={4}
                    shouldHideTransparentColor
                />
            </div>
        </div>
    )
}
