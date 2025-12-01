import './ShapeBorderColorDropdown.scss'
import { Button } from '@/components/ui/button'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { ChangeTextAlign } from '@/core/command/ChangeTextAlign'
import { CommandCtx } from '@/core/command/Command'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'

export interface TextAlignDropdownProps {
    engine: Engine
    onTextAlignChange: (newTextAlign: TEXT_ALIGN) => void
}

export function TextAlignDropdown({
    engine,
    onTextAlignChange,
}: TextAlignDropdownProps) {
    const handleAlignChange = (alignment: TEXT_ALIGN) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeTextAlign()) return

        const command = new ChangeTextAlign('changeTextAlign')
        const ctx: CommandCtx = {
            selectionService,
            engine,
            params: {
                textAlign: alignment,
                widgets,
            },
        }

        command.execute(ctx)
        onTextAlignChange(alignment)
    }

    return (
        <div className="text_align_dd absolute bg-white top-[60px] left-[50%] shadow-l -translate-x-1/2 rounded-xl shadow-xs select-none">
            <div className="p-2 flex">
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleAlignChange('left')}
                    title="Align Left"
                >
                    <AlignLeft />
                </Button>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleAlignChange('center')}
                    title="Align Center"
                >
                    <AlignCenter />
                </Button>
                <Button
                    variant="ghost"
                    className="flex items-center justify-center"
                    onClick={() => handleAlignChange('right')}
                    title="Align Right"
                >
                    <AlignRight />
                </Button>
            </div>
        </div>
    )
}
