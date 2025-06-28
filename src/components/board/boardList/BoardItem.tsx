import { Badge } from '@/components/ui/badge.tsx'
import { BoardResult } from '@/types/Board.ts'
import { Link } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Ellipsis } from 'lucide-react'
import { useEffect, useRef } from 'react'

function generateRandomRadialGradient() {
    const posX = Math.floor(Math.random() * 101) // 0 to 100
    const posY = Math.floor(Math.random() * 101) // 0 to 100

    const hue = Math.floor(Math.random() * 361) // 0 to 360
    const saturation = Math.floor(Math.random() * 31) + 70 // 70 to 100 for vibrant colors
    const lightness = Math.floor(Math.random() * 31) + 50 // 50 to 80 for good visibility

    return `radial-gradient(at ${posX}% ${posY}%, hsla(${hue},${saturation}%,${lightness}%,1) 0px, transparent 50%)`
}

function generateRandomGradientSet(count = 7) {
    const gradients = []
    for (let i = 0; i < count; i++) {
        gradients.push(generateRandomRadialGradient())
    }
    return gradients.join(',')
}

export function BoardItem({ board }: { board: BoardResult }) {
    const gradientRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        gradientRef.current!.style.background = generateRandomGradientSet(7)
    }, [])

    return (
        <Link
            key={board.slug_id}
            to={`/boards/${board.slug_id}`}
            className="board_item rounded-b shadow-md w-[300px] border-2 border-white hover:border-zinc-200 cursor-pointer select-none a"
            aria-label={board.name}
        >
            <div
                className="h-36 relative flex justify-center items-center"
                style={{
                    backgroundSize: '15px 15px',
                    backgroundImage:
                        'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)',
                }}
            >
                <div
                    className="absolute left-0 top-0 w-full h-full blurred_bg variant-3 overflow-hidden opacity-55 backdrop-filter backdrop-blur-md"
                    ref={gradientRef}
                ></div>
                <div className="absolute right-2 top-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className=""
                                variant="secondary"
                                size="icon"
                            >
                                <Ellipsis />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="left">
                            <DropdownMenuItem>Delete board</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="absolute right-2 bottom-2 flex gap-2">
                    {board.is_owner ? (
                        <Badge className="select-none">owner</Badge>
                    ) : null}
                </div>
                <span className="text-sm tracking-widest font-black font-mono border-2 rounded-xl bg-yellow-100 p-5">
                    WB
                </span>
            </div>
            <div className="p-5">
                <h2 className="text-md font-bold">{board.name}</h2>
                <span className="text-xs ">
                    {new Date(board.created_at).toLocaleDateString()}
                </span>
            </div>
        </Link>
    )
}
