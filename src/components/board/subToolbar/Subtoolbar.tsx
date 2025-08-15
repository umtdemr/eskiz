import { Copy, Trash2 } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import './Subtoolbar.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip'

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
                            <button className="iconBox">
                                <Copy />
                            </button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div id="remove">
                            <button className="iconBox">
                                <Trash2 />
                            </button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
