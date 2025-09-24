import { Button } from '@/components/ui/button'
import './ShapeBorderColorDropdown.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { ColorList } from '@/components/colorList/ColorList'

export function ShapeBorderColorDropdown() {
    return (
        <div className="shape_border_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            {/* Border style */}
            <div className="flex justify-center">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="borderStyleBtn active"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M 2 12 H 22"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Solid</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" className="borderStyleBtn">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M 2 12 h 4 M 10 12 h 4 M 18 12 h 4"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="butt"
                                />
                            </svg>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Dashed</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" className="borderStyleBtn">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M 4 12 h 0.01 M 9 12 h 0.01 M 14 12 h 0.01 M 19 12 h 0.01"
                                    stroke="currentColor"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Dotted</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="p-2">
                <span className="text-xs mb-1 block">Thickness</span>
                <Slider
                    defaultValue={[2]}
                    max={12}
                    step={1}
                    min={2}
                    onValueChange={(...val) => console.log(val)}
                />
            </div>

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
                <span className="text-xs mb-1 block">Roundness</span>
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
