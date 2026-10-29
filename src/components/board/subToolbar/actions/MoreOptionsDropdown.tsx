import './ShapeBorderColorDropdown.scss'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { useBoundStore } from '@/store/store'
import { ZIndexAction } from '@/core/command/ChangeZIndex'
import { formatKeys, MOD, SHIFT } from '@/helpers/KeyHelpers'
import { ExportService } from '@/core/services/ExportService'
import { toast } from 'react-hot-toast'

const zIndexActions: { label: string; action: ZIndexAction; keys: string[] }[] =
    [
        {
            label: 'Bring to Front',
            action: 'bringToFront',
            keys: [MOD, SHIFT, ']'],
        },
        { label: 'Bring Forward', action: 'bringForward', keys: [MOD, ']'] },
        { label: 'Send Backward', action: 'sendBackward', keys: [MOD, '['] },
        {
            label: 'Send to Back',
            action: 'sendToBack',
            keys: [MOD, SHIFT, '['],
        },
    ]

export interface MoreOptionsDropdownProps {
    engine: Engine
}

// shared with the right click menu
export function MoreOptionsItems({ engine }: MoreOptionsDropdownProps) {
    const copyPng = async () => {
        const service = engine.getService<ExportService>('export')
        const widgets = service.getWidgets(true)
        const options = { widgets, scale: 1, background: false, padding: 0 }
        if (!(await service.copy(options))) {
            toast.error('Could not copy the image.')
        }
    }

    return (
        <>
            <DropdownMenuItem onClick={() => engine.execute('copy', {})}>
                Copy
                <DropdownMenuShortcut>
                    {formatKeys([MOD, 'C'])}
                </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyPng}>Copy as PNG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => engine.execute('delete', {})}>
                Delete
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {zIndexActions.map(({ label, action, keys }) => (
                <DropdownMenuItem
                    key={action}
                    onClick={() => engine.execute('changeZIndex', { action })}
                >
                    {label}
                    <DropdownMenuShortcut>
                        {formatKeys(keys)}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            ))}
        </>
    )
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
                <MoreOptionsItems engine={engine} />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
