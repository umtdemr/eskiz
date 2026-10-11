import './ShapeBorderColorDropdown.scss'
import { Button } from '@/components/ui/button'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
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
        if (!engine.execute('changeTextAlign', { textAlign: alignment })) return

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
