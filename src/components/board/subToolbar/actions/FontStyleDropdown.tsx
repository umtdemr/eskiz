import './ShapeBorderColorDropdown.scss'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { CommandCtx } from '@/core/command/Command'
import { TextEditor } from '@/core/textEditor/TextEditor'
import { FontStyleType } from '@/helpers/Constant'
import { TextBox } from '@/core/shapes/text/TextBox'
import { Shape } from '@/core/shapes/Shape'
import { StickyNote } from '@/core/shapes/stickyNote/StickyNote'

export interface FontStyleDropdownProps {
    engine: Engine
}

export function FontStyleDropdown({ engine }: FontStyleDropdownProps) {
    const handleStyleToggle = (style: FontStyleType) => {
        const textEditor = engine.textEditor
        if (textEditor.isActive) {
            styleToggleInEditingMode(textEditor, style)
            return
        }

        // handle font style change in normal mode
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return

        // check if the style is currently applied
        const firstWidget = widgets[0]
        let currentValue = false

        if (
            firstWidget instanceof TextBox ||
            firstWidget instanceof Shape ||
            firstWidget instanceof StickyNote
        ) {
            currentValue = firstWidget.hasFontStyle(style)
        }

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: false,
            params: {
                style,
                value: !currentValue, // toggle
                widgets,
            },
        }
        engine.getCommand('changeFontStyle').execute(ctx)
    }

    const styleToggleInEditingMode = (
        textEditor: TextEditor,
        style: FontStyleType,
    ) => {
        const selection = textEditor.getSelection()
        if (!selection) return

        const currentFormat = textEditor.getFormat()
        const currentValue = currentFormat[style] || false

        textEditor.format(style, !currentValue)
    }

    return (
        <div className="font_style_dd absolute bg-white top-[60px] left-[50%] shadow-l -translate-x-1/2 rounded-xl shadow-xs select-none">
            <div className="p-2 flex">
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleStyleToggle('bold')}
                    title="Bold"
                >
                    <Bold />
                </Button>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleStyleToggle('italic')}
                    title="Italic"
                >
                    <Italic />
                </Button>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleStyleToggle('underline')}
                    title="Underline"
                >
                    <Underline />
                </Button>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleStyleToggle('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough />
                </Button>
            </div>
        </div>
    )
}
