import { Service } from './Service'
import { Engine } from '../engine/Engine'
import { MouseController } from '../engine/MouseController'
import { Point } from '../canvas/Canvas'
import { WidgetJson } from '../shapes/Widget'
import { SelectionService } from './SelectionService'
import { isOutsideBoard } from './ShortcutService'
import type { ImageUploadService } from './ImageUploadService'

// widgets go into the copied html as an empty span, so another board can
// paste them but pasting into a text field shows nothing
export const encodeWidgets = (widgets: WidgetJson[]) =>
    `<span data-eskiz="${encodeURIComponent(JSON.stringify({ widgets }))}"></span>`

export const decodeWidgets = (html: string): WidgetJson[] | null => {
    const match = html.match(/data-eskiz="([^"]*)"/)
    if (!match) return null

    try {
        const { widgets } = JSON.parse(decodeURIComponent(match[1]))
        return Array.isArray(widgets) && widgets.length ? widgets : null
    } catch {
        return null
    }
}

export class ClipboardService extends Service {
    private mouseController: MouseController
    private lastMouse: MouseEvent | null = null
    private offMouseMove: () => void

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController
        this.offMouseMove = mouseController.on('mouseMove', ({ e }) => {
            this.lastMouse = e
        })
        document.addEventListener('copy', this.onCopy)
        document.addEventListener('cut', this.onCut)
        document.addEventListener('paste', this.onPaste)
    }

    private canHandle(e: ClipboardEvent) {
        if (!this.enabled || e.defaultPrevented || !e.clipboardData) {
            return false
        }
        if (isOutsideBoard(e.target) || this.engine.textEditor.isActive) {
            return false
        }
        return !this.mouseController.isMouseDown
    }

    // returns true when the selection went into the clipboard
    private copy(e: ClipboardEvent) {
        if (!this.canHandle(e)) return false

        const { selected } =
            this.engine.getService<SelectionService>('selection')
        if (!selected.length || selected.some((widget) => widget.isLocked)) {
            return false
        }

        const html = encodeWidgets(selected.map((widget) => widget.toJson()))
        e.clipboardData!.setData('text/html', html)
        e.preventDefault()
        return true
    }

    private onCopy = (e: ClipboardEvent) => {
        this.copy(e)
    }

    private onCut = (e: ClipboardEvent) => {
        if (this.copy(e)) this.engine.execute('delete', {})
    }

    private onPaste = (e: ClipboardEvent) => {
        if (!this.canHandle(e)) return

        const { clipboardData } = e
        const widgets = decodeWidgets(clipboardData!.getData('text/html'))
        if (widgets) {
            e.preventDefault()
            this.engine.execute('paste', { widgets, at: this.pastePoint() })
            return
        }

        // screenshots and copied images
        const images = Array.from(clipboardData!.files).filter((file) =>
            file.type.startsWith('image/'),
        )
        if (!images.length) return

        e.preventDefault()
        this.engine
            .getService<ImageUploadService>('imageUpload')
            .upload(images, this.pastePoint())
    }

    // under the mouse, or the middle of the screen before it moved
    private pastePoint(): Point {
        const canvas = this.engine.canvas
        if (this.lastMouse) return canvas.getPointer(this.lastMouse)

        return {
            x: -canvas.translateX + canvas.canvasEl.width / canvas.zoom / 2,
            y: -canvas.translateY + canvas.canvasEl.height / canvas.zoom / 2,
        }
    }

    dispose() {
        this.offMouseMove()
        document.removeEventListener('copy', this.onCopy)
        document.removeEventListener('cut', this.onCut)
        document.removeEventListener('paste', this.onPaste)
    }
}
