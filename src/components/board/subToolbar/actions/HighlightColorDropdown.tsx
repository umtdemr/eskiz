import './ShapeBorderColorDropdown.scss'
import { ColorList } from '@/components/colorList/ColorList'

export function HighlightColorDropdown() {
    return (
        <div className="highlight_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            <div className="p-2">
                <ColorList
                    onColorSelect={(color) => console.log('Highlight color selected:', color)}
                    perColumn={4}
                />
            </div>
        </div>
    )
}