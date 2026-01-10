import { useRef } from 'react'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { ChangeBorderColor } from '@/core/command/ChangeBorderColor'
import { CommandCtx } from '@/core/command/Command'

export interface LineColorDropdownProps {
    engine: Engine
    closeDropdown: () => void
}

export function LineColorDropdown({
    engine,
    closeDropdown,
}: LineColorDropdownProps) {
    const changeBorderColorCommandRef = useRef(
        new ChangeBorderColor('changeBorderColor'),
    )

    const handleColorSelect = (signature: ColorSelectSignature) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeBorderColor()) return

        const color = { ...signature.color, a: 1 }

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: !signature.isImmediate,
            params: {
                color,
                widgets,
            },
        }
        changeBorderColorCommandRef.current?.execute(ctx)
        closeDropdown()
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
