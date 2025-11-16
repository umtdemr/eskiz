import './ShapeBorderColorDropdown.scss'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { useBoundStore } from '@/store/store'

export interface MoreOptionsDropdownProps {
    engine: Engine
}

export function MoreOptionsDropdown({ engine }: MoreOptionsDropdownProps) {
    const { activeDropdown, toggleDropdown } = useBoundStore()
    const isOpen = activeDropdown === 'moreOptions'

    const handleOpenChange = (open: boolean) => {
        if (open) {
            toggleDropdown('moreOptions')
        } else if (isOpen) {
            toggleDropdown('moreOptions')
        }
    }

    const handleBringToFront = () => {
        console.log('Bring to front')
    }

    const handleBringForward = () => {
        console.log('Bring forward')
    }

    const handleSendBackward = () => {
        console.log('Send backward')
    }

    const handleSendToBack = () => {
        console.log('Send to back')
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button className="iconBox">
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="rounded-xl shadow-xs select-none"
                sideOffset={10}
            >
                <DropdownMenuItem onClick={handleBringToFront}>
                    Bring to Front
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBringForward}>
                    Bring Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendBackward}>
                    Send Backward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendToBack}>
                    Send to Back
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
