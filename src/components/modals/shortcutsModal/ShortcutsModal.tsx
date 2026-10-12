import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import { MOD, SHIFT } from '@/helpers/KeyHelpers'

// keep in sync with the shortcuts on the commands and ClipboardService
const groups: { title: string; items: [string, string[][]][] }[] = [
    {
        title: 'Tools',
        items: [
            ['Select', [['V']]],
            ['Pan', [['H']]],
            ['Text', [['T']]],
            ['Rectangle', [['R']]],
            ['Ellipse', [['O']]],
            ['Line', [['L']]],
            ['Pen', [['P']]],
            ['Eraser', [['E']]],
            ['Sticky note', [['S']]],
        ],
    },
    {
        title: 'Edit',
        items: [
            ['Undo', [[MOD, 'Z']]],
            [
                'Redo',
                [
                    [MOD, SHIFT, 'Z'],
                    [MOD, 'Y'],
                ],
            ],
            ['Copy', [[MOD, 'C']]],
            ['Cut', [[MOD, 'X']]],
            ['Paste', [[MOD, 'V']]],
            ['Duplicate', [[MOD, 'D']]],
            ['Delete', [['Delete'], ['Backspace']]],
            ['Select all', [[MOD, 'A']]],
            ['Deselect', [['Esc']]],
            ['Lock / unlock', [[MOD, SHIFT, 'L']]],
        ],
    },
    {
        title: 'Arrange',
        items: [
            ['Move', [['←↑→↓']]],
            ['Move by 10', [[SHIFT, '←↑→↓']]],
            ['Bring forward', [[MOD, ']']]],
            ['Bring to front', [[MOD, SHIFT, ']']]],
            ['Send backward', [[MOD, '[']]],
            ['Send to back', [[MOD, SHIFT, '[']]],
        ],
    },
]

export function ShortcutsModal({
    isOpen = false,
    closeModal,
}: {
    isOpen: boolean
    closeModal: () => void
}) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) closeModal()
            }}
        >
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                </DialogHeader>
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    {groups.map((group) => (
                        <section key={group.title}>
                            <h3 className="mb-2 text-sm font-medium text-zinc-500">
                                {group.title}
                            </h3>
                            <ul className="flex flex-col gap-1.5">
                                {group.items.map(([label, combos]) => (
                                    <li
                                        key={label}
                                        className="flex items-center justify-between gap-4 text-sm"
                                    >
                                        <span>{label}</span>
                                        <span className="flex items-center gap-1.5 text-zinc-400">
                                            {combos.map((keys, i) => (
                                                <span
                                                    key={i}
                                                    className="flex items-center gap-1"
                                                >
                                                    {i > 0 && 'or'}
                                                    {keys.map((key) => (
                                                        <kbd
                                                            key={key}
                                                            className="min-w-6 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-center font-sans text-xs text-zinc-700"
                                                        >
                                                            {key}
                                                        </kbd>
                                                    ))}
                                                </span>
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
