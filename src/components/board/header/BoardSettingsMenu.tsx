import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { EllipsisVertical, Grid3X3, Keyboard, ImageDown } from 'lucide-react'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'
import { GridType } from '@/core/settings/Settings'
import { BoardGridType } from '@/core/constants'
import { ShortcutsModal } from '@/components/modals/shortcutsModal/ShortcutsModal'
import { ExportModal } from '@/components/modals/exportModal/ExportModal'

const gridTypes: { type: GridType; label: string }[] = [
    { type: BoardGridType.NONE, label: 'None' },
    { type: BoardGridType.LINES, label: 'Line grid' },
    { type: BoardGridType.DOTS, label: 'Dot grid' },
]

interface BoardSettingsMenuProps {
    engine: Engine
}

export function BoardSettingsMenu({ engine }: BoardSettingsMenuProps) {
    const gridType = useBoundStore((state) => state.gridType)
    const isGridSnapEnabled = useBoundStore((state) => state.isGridSnapEnabled)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [showExport, setShowExport] = useState(false)

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <EllipsisVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Grid3X3 className="mr-2 h-4 w-4" />
                            <span>Grid</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {gridTypes.map(({ type, label }) => (
                                    <DropdownMenuCheckboxItem
                                        key={type}
                                        checked={gridType === type}
                                        onCheckedChange={() =>
                                            engine.settings.set({
                                                gridType: type,
                                            })
                                        }
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={isGridSnapEnabled}
                                    onCheckedChange={(checked) =>
                                        engine.settings.set({
                                            isGridSnapEnabled: checked,
                                        })
                                    }
                                >
                                    Snap to grid
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onSelect={() => setShowExport(true)}>
                        <ImageDown className="mr-2 h-4 w-4" />
                        <span>Export board</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowShortcuts(true)}>
                        <Keyboard className="mr-2 h-4 w-4" />
                        <span>Keyboard shortcuts</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <ExportModal
                engine={engine}
                isOpen={showExport}
                closeModal={() => setShowExport(false)}
            />
            <ShortcutsModal
                isOpen={showShortcuts}
                closeModal={() => setShowShortcuts(false)}
            />
        </>
    )
}
