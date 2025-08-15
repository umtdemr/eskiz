import {
    Copy,
    Trash2,
    LockKeyholeOpen,
    Baseline,
    WholeWord,
} from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import './Subtoolbar.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export interface SubtoolbarProps {
    engine: Engine
}
export default function Subtoolbar({ engine }: SubtoolbarProps) {
    return (
        <div className="sub_toolbar">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="duplicate">
                            <Button className="iconBox">
                                <Copy />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="remove">
                            <Button className="iconBox">
                                <Trash2 />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="lock">
                            <Button className="iconBox">
                                <LockKeyholeOpen />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Lock</TooltipContent>
                </Tooltip>
                <div className="seperator" role="separator"></div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="fontStyle">
                            <Button className="iconBox">
                                <WholeWord />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Font style</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="textColor">
                            <Button className="iconBox">
                                <Baseline />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Text color</TooltipContent>
                </Tooltip>
                <div className="seperator" role="separator"></div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="borderStyleColor">
                            <Button className="iconBox">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    className="lucide lucide-squircle-icon lucide-squircle"
                                >
                                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                                </svg>
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Border style and color</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="backgroundColor">
                            <Button className="iconBox">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    className="lucide lucide-squircle-icon lucide-squircle"
                                >
                                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />
                                </svg>
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Background color</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
