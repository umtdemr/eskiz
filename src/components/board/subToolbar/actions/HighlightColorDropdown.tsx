import './ShapeBorderColorDropdown.scss'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { ChangeHighlightColor } from '@/core/command/ChangeHighlightColor'
import { CommandCtx } from '@/core/command/Command'
import { useRef } from 'react'
import { TextEditor } from '@/core/textEditor/TextEditor'

export interface HighlightColorDropdownProps {
    engine: Engine
}

export function HighlightColorDropdown({
    engine,
}: HighlightColorDropdownProps) {
    const changeHighlightColorCommandRef = useRef(
        new ChangeHighlightColor('changeHighlightColor'),
    )

    const handleColorSelect = (signature: ColorSelectSignature) => {
        const textEditor = engine.textEditor
        if (textEditor.isActive) {
            colorSelectInEditingMode(textEditor, signature)
            return
        }

        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeHighlightColor()) return

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
        changeHighlightColorCommandRef.current?.execute(ctx)
    }

    const colorSelectInEditingMode = (
        textEditor: TextEditor,
        signature: ColorSelectSignature,
    ) => {
        console.log(signature.rgba)
        textEditor.format('background', signature.rgba)
        // TODO: trigger continuous update -- check if it is immediate or not first.
        // todo: close editor
    }

    return (
        <div className="highlight_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            <div className="p-2">
                <ColorList onColorSelect={handleColorSelect} perColumn={4} />
            </div>
        </div>
    )
}

