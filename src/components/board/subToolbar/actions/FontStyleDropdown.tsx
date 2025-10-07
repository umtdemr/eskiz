import './ShapeBorderColorDropdown.scss'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'

export function FontStyleDropdown() {
    const handleStyleToggle = (
        style: 'bold' | 'italic' | 'underline' | 'strikethrough',
    ) => {
        console.log('Font style toggled:', style)
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
                    onClick={() => handleStyleToggle('strikethrough')}
                    title="Strikethrough"
                >
                    <Strikethrough />
                </Button>
            </div>
        </div>
    )
}

