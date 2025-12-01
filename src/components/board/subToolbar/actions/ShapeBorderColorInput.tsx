import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ShapeBorderColorDropdown } from './ShapeBorderColorDropdown'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'

export interface ShapeBorderColorInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function ShapeBorderColorInput({
    tooltip,
    id,
    engine,
}: ShapeBorderColorInputProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isActive = activeDropdown === 'shapeBorderColor'

    const handleClick = () => {
        toggleDropdown('shapeBorderColor')
    }

    return (
        <div id={id} className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Button
                            className="iconBox"
                            onClick={handleClick}
                            data-active={isActive}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="z-10"
                            >
                                <path
                                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                                    stroke="rgba(0, 0, 0, 1)"
                                />
                            </svg>

                            {/* Transparent bg effect */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="200"
                                height="200"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="absolute"
                            >
                                <defs>
                                    <pattern
                                        id="checkerboard"
                                        width="8"
                                        height="8"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <rect
                                            width="8"
                                            height="8"
                                            fill="#fff"
                                        />
                                        <rect
                                            width="4"
                                            height="4"
                                            fill="#ccc"
                                        />
                                        <rect
                                            x="4"
                                            y="4"
                                            width="4"
                                            height="4"
                                            fill="#ccc"
                                        />
                                    </pattern>
                                </defs>

                                <path
                                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                                    stroke="black"
                                    stroke-width="6"
                                    fill="none"
                                />

                                <path
                                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                                    stroke="url(#checkerboard)"
                                    stroke-width="3"
                                    fill="none"
                                />
                            </svg>
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {isActive && <ShapeBorderColorDropdown engine={engine} />}
        </div>
    )
}
