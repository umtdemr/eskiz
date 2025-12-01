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
import { ZIndexAction } from '@/core/command/ChangeZIndex'
import { SelectionService } from '@/core/services/SelectionService'
import { CommandCtx } from '@/core/command/Command'

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

    const executeZIndexCommand = (action: ZIndexAction) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        if (!selectionService || selectionService.selected.length === 0) return

        const command = engine.getCommand('changeZIndex')
        const ctx: CommandCtx = {
            selectionService,
            engine,
            params: { action },
        }

        command.execute(ctx)
    }

    const handleBringToFront = () => {
        executeZIndexCommand('bringToFront')
    }

    const handleBringForward = () => {
        executeZIndexCommand('bringForward')
    }

    const handleSendBackward = () => {
        executeZIndexCommand('sendBackward')
    }

    const handleSendToBack = () => {
        executeZIndexCommand('sendToBack')
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
