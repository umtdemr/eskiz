import './ShapeBorderColorDropdown.scss'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { ChangeTextColor } from '@/core/command/ChangeTextColor'
import { CommandCtx } from '@/core/command/Command'
import { useRef } from 'react'

export interface TextColorDropdownProps {
    engine: Engine
}

export function TextColorDropdown({ engine }: TextColorDropdownProps) {
    const changeTextColorCommandRef = useRef(
        new ChangeTextColor('changeTextColor'),
    )

    const handleColorSelect = (signature: ColorSelectSignature) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeTextColor()) return

        const color = signature.color

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: !signature.isImmediate,
            params: {
                color,
                widgets,
            },
        }
        changeTextColorCommandRef.current?.execute(ctx)
    }

    return (
        <div className="text_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            <div className="p-2">
                <ColorList onColorSelect={handleColorSelect} perColumn={4} shouldHideTransparentColor />
            </div>
        </div>
    )
}