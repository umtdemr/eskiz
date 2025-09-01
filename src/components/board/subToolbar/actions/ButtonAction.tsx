import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export type ButtonActionProps = {
    id: string
    tooltip: string
    onClick: () => void
    icon: React.ReactNode
}

/**
 * ButtonAction is a general command handler.
 * It is a generic icon button for sub toolbar
 */
export function ButtonAction(props: ButtonActionProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div id={props.id}>
                    <Button className="iconBox" onClick={props.onClick}>
                        {props.icon}
                    </Button>
                </div>
            </TooltipTrigger>
            <TooltipContent>{props.tooltip}</TooltipContent>
        </Tooltip>
    )
}
