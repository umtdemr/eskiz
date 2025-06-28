import { Service } from '@/core/services/Service.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { ToolService } from '@/core/services/ToolService.ts'

export enum CursorPriority {
    Default = 10,
    Hover = 20,
}

export type ResizeCursors =
    | 'horizontal-resize'
    | 'vertical-resize'
    | 'scale-resize-left'
    | 'scale-resize-right'

export type Cursors =
    | 'default'
    | 'pointer'
    | 'pan'
    | 'panning'
    | 'crosshair'
    | ResizeCursors

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
