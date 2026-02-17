import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { ToolService } from '@/core/services/ToolService.ts'
import { CursorType } from '@/core/constants.ts'

export enum CursorPriority {
    Default = 10,
    Hover = 20,
}

export type ResizeCursors =
    | typeof CursorType.HORIZONTAL_RESIZE
    | typeof CursorType.VERTICAL_RESIZE
    | typeof CursorType.SCALE_RESIZE_LEFT
    | typeof CursorType.SCALE_RESIZE_RIGHT

export type Cursors =
    | typeof CursorType.DEFAULT
    | typeof CursorType.POINTER
    | typeof CursorType.PAN
    | typeof CursorType.PANNING
    | typeof CursorType.CROSSHAIR
    | ResizeCursors
    | typeof CursorType.TEXT
    | typeof CursorType.STICKY_NOTE

export interface CursorRequest {
    cursor: Cursors
    priority: CursorPriority
}

/*
Handles changing cursor style of upper canvas element
 */
export class CursorService extends Service {
    private registeredCursors: Map<Cursors, string> = new Map()
    private requests = new Map<string, CursorRequest>()
    private toolService: ToolService

    constructor(engine: Engine) {
        super(engine)
        this.toolService = this.engine.getService<ToolService>('toolService')
        this.toolService.mainModeChanged.add(this.onToolChanged, this)

        const stickyNoteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><path d="M15 3v5a1 1 0 0 0 1 1h5"/></svg>`
        const stickyNoteCursor = `url("data:image/svg+xml,${encodeURIComponent(stickyNoteSvg)}") 12 12, crosshair`

        this.registeredCursors = new Map<Cursors, string>([
            ['default', 'default'],
            ['pointer', 'pointer'],
            ['pan', 'grab'],
            ['panning', 'grabbing'],
            ['crosshair', 'crosshair'],
            ['horizontal-resize', 'ew-resize'],
            ['vertical-resize', 'ns-resize'],
            ['scale-resize-left', 'nwse-resize'],
            ['scale-resize-right', 'nesw-resize'],
            ['text', 'text'],
            ['sticky-note', stickyNoteCursor],
        ])
    }

    private onToolChanged() {
        this._clearRequests()
    }

    private _clearRequests() {
        this.requests.clear()
    }

    private _updateCursor() {
        if (!this.engine.upperCanvasEl) {
            return
        }

        if (this.requests.size === 0) {
            this.engine.upperCanvasEl.style.cursor = 'default'
            return
        }

        let highestPriortiyReq: CursorRequest | null = null
        for (const request of this.requests.values()) {
            if (
                !highestPriortiyReq ||
                request.priority > highestPriortiyReq.priority
            ) {
                highestPriortiyReq = request
            }
        }

        if (highestPriortiyReq) {
            const cssCursor = this.registeredCursors.get(
                highestPriortiyReq.cursor,
            )!
            this.engine.upperCanvasEl.style.cursor = cssCursor
        }
    }

    setCursor(owner: string, cursor: Cursors, priority?: CursorPriority) {
        this.requests.set(owner, {
            cursor,
            ...{
                priority:
                    priority !== undefined ? priority : CursorPriority.Default,
            },
        })
        this._updateCursor()
    }

    unsetCursor(owner: string) {
        if (this.requests.delete(owner)) {
            this._updateCursor()
        }
    }

    disopse() {
        this._clearRequests()
    }
}
