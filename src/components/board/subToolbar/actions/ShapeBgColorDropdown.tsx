import './ShapeBorderColorDropdown.scss'
import { Slider } from '@/components/ui/slider'
import { ColorList } from '@/components/colorList/ColorList'

export function ShapeBgColorDropdown() {
    return (
        <div className="shape_border_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            <div className="p-2">
                <span className="text-xs mb-1 block">Opacity</span>
                <Slider
                    defaultValue={[2]}
                    max={12}
                    step={1}
                    min={2}
                    onValueChange={(...val) => console.log(val)}
                />
            </div>

            <div className="p-2">
                <ColorList
                    onColorSelect={(color) => console.log(color)}
                    perColumn={4}
                />
            </div>
        </div>
    )
}
