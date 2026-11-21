import { Button } from '@/components/ui/button'
import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignEndVertical,
    AlignHorizontalDistributeCenter,
    AlignStartHorizontal,
    AlignStartVertical,
    AlignVerticalDistributeCenter,
} from 'lucide-react'
import { Engine } from '@/core/engine/Engine'
import { AlignTo } from '@/core/command/Align'

type Row = {
    align: { to: AlignTo; title: string; icon: React.ReactNode }[]
    distribute: { axis: 'x' | 'y'; title: string; icon: React.ReactNode }
}

const rows: Row[] = [
    {
        align: [
            { to: 'left', title: 'Align left', icon: <AlignStartVertical /> },
            {
                to: 'centerX',
                title: 'Align horizontal centers',
                icon: <AlignCenterVertical />,
            },
            { to: 'right', title: 'Align right', icon: <AlignEndVertical /> },
        ],
        distribute: {
            axis: 'x',
            title: 'Distribute horizontally',
            icon: <AlignHorizontalDistributeCenter />,
        },
    },
    {
        align: [
            { to: 'top', title: 'Align top', icon: <AlignStartHorizontal /> },
            {
                to: 'centerY',
                title: 'Align vertical centers',
                icon: <AlignCenterHorizontal />,
            },
            {
                to: 'bottom',
                title: 'Align bottom',
                icon: <AlignEndHorizontal />,
            },
        ],
        distribute: {
            axis: 'y',
            title: 'Distribute vertically',
            icon: <AlignVerticalDistributeCenter />,
        },
    },
]

export interface AlignDropdownProps {
    engine: Engine
}

export function AlignDropdown({ engine }: AlignDropdownProps) {
    return (
        <div className="absolute bg-white top-[60px] left-[50%] -translate-x-1/2 rounded-xl shadow-xs select-none">
            <div className="p-2 flex flex-col gap-1">
                {rows.map(({ align, distribute }) => (
                    <div key={distribute.axis} className="flex items-center">
                        {align.map(({ to, title, icon }) => (
                            <Button
                                key={to}
                                variant="ghost"
                                title={title}
                                disabled={!engine.canExecute('align', { to })}
                                onClick={() => engine.execute('align', { to })}
                            >
                                {icon}
                            </Button>
                        ))}
                        <div className="w-px h-6 mx-1 bg-gray-200" />
                        <Button
                            variant="ghost"
                            title={distribute.title}
                            disabled={
                                !engine.canExecute('distribute', {
                                    axis: distribute.axis,
                                })
                            }
                            onClick={() =>
                                engine.execute('distribute', {
                                    axis: distribute.axis,
                                })
                            }
                        >
                            {distribute.icon}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
