import { MoveUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Engine } from '@/core/engine/Engine'
import { useState, useRef } from 'react'
import { LineStyleDropdown } from './LineStyleDropdown'
import useOnClickOutside from '@/hooks/UseOutsideClick'

export interface LineStyleInputProps {
    id: string
    tooltip: string
    engine: Engine
}

export function LineStyleInput({ id, tooltip, engine }: LineStyleInputProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useOnClickOutside(ref, () => setOpen(false))

    return (
        <div ref={ref} className="relative" id={id}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="iconBox"
                        onClick={() => setOpen(!open)}
                        data-active={open}
                    >
                        <MoveUpRight />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
            {open && <LineStyleDropdown engine={engine} />}
        </div>
    )
}
