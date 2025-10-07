import './ShapeBorderColorDropdown.scss'
import { Button } from '@/components/ui/button'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

export function TextAlignDropdown() {
    const handleAlignChange = (
        alignment: 'left' | 'center' | 'right' | 'justify',
    ) => {
        console.log('Text alignment changed:', alignment)
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

