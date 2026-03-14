import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings, Grid3X3, Check } from 'lucide-react'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'
import { GridType } from '@/core/canvas/Canvas'
import { BoardGridType } from '@/core/constants'

interface BoardSettingsMenuProps {
    engine: Engine
}

export function BoardSettingsMenu({ engine }: BoardSettingsMenuProps) {
    const gridType = useBoundStore((state) => state.gridType)
    const setGridType = useBoundStore((state) => state.setGridType)

    const handleChangeGridType = (newType: GridType) => {
        if (engine && engine.canvas) {
            engine.canvas.setGridType(newType)
            setGridType(newType)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
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
                            <DropdownMenuItem
                                onClick={() =>
                                    handleChangeGridType(BoardGridType.NONE)
                                }
                            >
                                {gridType === 'none' && (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                <span
                                    className={
                                        gridType !== 'none' ? 'pl-6' : ''
                                    }
                                >
                                    None
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    handleChangeGridType(BoardGridType.LINES)
                                }
                            >
                                {gridType === 'lines' && (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                <span
                                    className={
                                        gridType !== 'lines' ? 'pl-6' : ''
                                    }
                                >
                                    Line Grid
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    handleChangeGridType(BoardGridType.DOTS)
                                }
                            >
                                {gridType === 'dots' && (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                <span
                                    className={
                                        gridType !== 'dots' ? 'pl-6' : ''
                                    }
                                >
                                    Dot Grid
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
