import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Copy, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { cn } from '@/lib/utils'
import { Engine } from '@/core/engine/Engine'
import { getDpr } from '@/core/canvas/Canvas'
import { ExportService } from '@/core/services/ExportService'
import { useBoundStore } from '@/store/store'

const SCALES = [1, 2, 3]
const PREVIEW_WIDTH = 400
const PREVIEW_HEIGHT = 240

const checkerboard = {
    backgroundImage:
        'conic-gradient(#e4e4e7 25%, #fff 0 50%, #e4e4e7 0 75%, #fff 0)',
    backgroundSize: '12px 12px',
}

const toBlob = (bytes: Uint8Array) =>
    new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' })

const fileName = (name?: string) =>
    `${(name || 'eskiz').replace(/[\\/:*?"<>|]/g, '-').trim()}.png`

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="flex h-8 items-center justify-between text-sm">
            <span>{label}</span>
            {children}
        </label>
    )
}

function ExportForm({ engine, close }: { engine: Engine; close: () => void }) {
    const service = engine.getService<ExportService>('export')
    const boardName = useBoundStore((state) => state.boardData?.name)

    // content only mounts while open, so this is the selection at open time
    const [hasSelection] = useState(() => service.getWidgets(true).length > 0)
    const [onlySelected, setOnlySelected] = useState(hasSelection)
    const [background, setBackground] = useState(true)
    const [scale, setScale] = useState(2)
    const [preview, setPreview] = useState<string | null>(null)

    const widgets = useMemo(
        () => service.getWidgets(onlySelected),
        [service, onlySelected],
    )
    const size = useMemo(
        () => service.getSize(widgets, scale),
        [service, widgets, scale],
    )

    useEffect(() => {
        if (!size) return

        const dpr = getDpr()
        const fit =
            size.scale *
            Math.min(
                1,
                (PREVIEW_WIDTH * dpr) / size.width,
                (PREVIEW_HEIGHT * dpr) / size.height,
            )
        const bytes = service.toPng({ widgets, scale: fit, background })
        if (!bytes) return

        const url = URL.createObjectURL(toBlob(bytes))
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [service, widgets, size, background])

    const render = () => {
        const bytes = service.toPng({ widgets, scale, background })
        if (!bytes) toast.error('Could not export the image.')
        return bytes && toBlob(bytes)
    }

    const download = () => {
        const blob = render()
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName(boardName)
        a.click()
        URL.revokeObjectURL(url)
        close()
    }

    const copy = async () => {
        const blob = render()
        if (!blob) return

        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
            ])
            toast.success('Copied to clipboard.')
            close()
        } catch {
            toast.error('Could not copy the image.')
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Export board</DialogTitle>
            </DialogHeader>
            <div className="flex h-60 items-center justify-center rounded-lg bg-zinc-100 p-4">
                {size && preview ? (
                    <img
                        src={preview}
                        alt="Export preview"
                        className="max-h-full max-w-full rounded-sm object-contain shadow-sm ring-1 ring-black/5"
                        style={background ? undefined : checkerboard}
                    />
                ) : (
                    <span className="text-sm text-zinc-400">
                        Nothing to export
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-1">
                {hasSelection ? (
                    <Row label="Only selected">
                        <Switch
                            checked={onlySelected}
                            onCheckedChange={setOnlySelected}
                        />
                    </Row>
                ) : null}
                <Row label="Background">
                    <Switch
                        checked={background}
                        onCheckedChange={setBackground}
                    />
                </Row>
                <div className="flex h-8 items-center justify-between text-sm">
                    <span>
                        Scale
                        {size ? (
                            <span className="ml-2 text-xs tabular-nums text-zinc-400">
                                {size.width} × {size.height} px
                            </span>
                        ) : null}
                    </span>
                    <div className="flex rounded-md bg-zinc-100 p-0.5">
                        {SCALES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setScale(s)}
                                className={cn(
                                    'h-7 w-10 rounded text-xs font-medium tabular-nums transition-colors',
                                    s === scale
                                        ? 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-900',
                                )}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={!size} onClick={copy}>
                    <Copy />
                    Copy to clipboard
                </Button>
                <Button disabled={!size} onClick={download}>
                    <Download />
                    Download PNG
                </Button>
            </div>
        </>
    )
}

export function ExportModal({
    engine,
    isOpen = false,
    closeModal,
}: {
    engine: Engine
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
            <DialogContent className="max-w-md gap-5">
                <ExportForm engine={engine} close={closeModal} />
            </DialogContent>
        </Dialog>
    )
}
