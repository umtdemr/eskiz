import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Minus, Plus, ZoomIn } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { Engine } from '@/core/engine/Engine.ts'

const ZOOM_STEPS = [
    0.01, 0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.75, 1, 1.25, 1.5,
    2, 3, 4,
]
const ZOOM_DROPDOWN = [0.25, 0.5, 1, 2]

export default function Footer({ engine }: { engine: Engine }) {
    const [zoom, setZoom] = useState(100)

    useEffect(() => {
        const unsubscribe = engine.on('zoom', (val) => {
            setZoom(Math.floor(val * 100))
        })

        return () => unsubscribe()
    }, [])

    const handleZoomOut = () => {
        const currentZoom = zoom / 100
        for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
            if (ZOOM_STEPS[i] < currentZoom - 0.001) {
                engine.zoomTo(ZOOM_STEPS[i])
                return
            }
        }
    }

    const handleZoomIn = () => {
        const currentZoom = zoom / 100
        for (let i = 0; i < ZOOM_STEPS.length; i++) {
            if (ZOOM_STEPS[i] > currentZoom + 0.001) {
                engine.zoomTo(ZOOM_STEPS[i])
                return
            }
        }
    }

    return (
        <div
            className="fixed flex gap-1 bottom-5 right-5 px-2 py-1 bg-white"
            style={{ boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}
        >
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 py-1"
                        onClick={handleZoomOut}
                    >
                        <Minus />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'top'}>
                    <p>Zoom out</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="px-2 py-1 w-11">
                                {zoom}%
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side={'top'}>
                            <p>Zoom and navigation</p>
                        </TooltipContent>
                    </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={20} side={'top'}>
                    {ZOOM_DROPDOWN.map((level) => (
                        <DropdownMenuItem
                            key={level}
                            onClick={() => engine.zoomTo(level)}
                        >
                            <ZoomIn /> {level * 100}%
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="px-2 py-1"
                        onClick={handleZoomIn}
                    >
                        <Plus />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={'top'}>
                    <p>Zoom in</p>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}
