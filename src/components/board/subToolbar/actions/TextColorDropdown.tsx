import './ShapeBorderColorDropdown.scss'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { Engine } from '@/core/engine/Engine'
import { TextEditor } from '@/core/textEditor/TextEditor'

export interface TextColorDropdownProps {
    engine: Engine
    closeDropdown: () => void
}

export function TextColorDropdown({
    engine,
    closeDropdown,
}: TextColorDropdownProps) {
    const handleColorSelect = (signature: ColorSelectSignature) => {
        const textEditor = engine.textEditor
        if (textEditor.isActive) {
            colorSelectInEditingMode(textEditor, signature)
            return
        }

        const executed = engine.execute(
            'changeTextColor',
            { rgba: signature.rgba },
            { continuous: !signature.isImmediate },
        )
        if (!executed) return

        closeDropdown()
    }

    const colorSelectInEditingMode = (
        textEditor: TextEditor,
        signature: ColorSelectSignature,
    ) => {
        textEditor.format('color', signature.rgba)
        // TODO: trigger continuous update -- check if it is immediate or not first.
        closeDropdown()
    }

    return (
        <div className="text_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
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
