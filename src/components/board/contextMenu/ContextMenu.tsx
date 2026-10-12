import { useEffect, useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreOptionsItems } from '@/components/board/subToolbar/actions/MoreOptionsDropdown'
import { Engine } from '@/core/engine/Engine'
import { SelectToolService } from '@/core/services/SelectToolService'

export default function ContextMenu({ engine }: { engine: Engine }) {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(
        null,
    )

    useEffect(() => {
        const opened =
            engine.getService<SelectToolService>('selectTool').contextMenuOpened
        opened.add(setPosition)
        return () => {
            opened.remove(setPosition)
        }
    }, [engine])

    return (
        // not modal, so the next right click reaches the board
        <DropdownMenu
            open={!!position}
            onOpenChange={(open) => !open && setPosition(null)}
            modal={false}
        >
            {/* empty anchor at the click, the menu opens from its corner */}
            <DropdownMenuTrigger asChild>
                <div
                    className="fixed pointer-events-none"
                    style={{ left: position?.x, top: position?.y }}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                // remount so it follows a new right click while open
                key={`${position?.x},${position?.y}`}
                align="start"
                sideOffset={0}
                className="rounded-xl shadow-xs select-none"
            >
                <MoreOptionsItems engine={engine} />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
