import { Engine, CanvasMouseEvent } from '@/core/engine/Engine.ts'
import { Service } from './Service'
import { MouseController } from '../engine/MouseController'
import { MainModeChangedState, ToolService } from './ToolService'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { CursorService } from '@/core/services/CursorService.ts'

export class PanToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private startPanX = 0
    private startPanY = 0
    private _isPanning = false
    private isActive: boolean = false
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.PAN_TOOL // to send request for changing cursor

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
        this.cursorService = this.engine.getService<CursorService>('cursor')
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.reset()
        this.isActive = state.tool === ACTION_MODES.PAN

        if (this.isActive) {
            this.init()
        }
    }

    init() {
        this.cursorService.setCursor(this.cursorToolName, 'pan')

        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    onMouseDown(data: CanvasMouseEvent) {
        const { e, canvas } = data
        this._isPanning = true
        this.startPanX = e.clientX - canvas.translateX * canvas.zoom
        this.startPanY = e.clientY - canvas.translateY * canvas.zoom
    }

    onMouseMove(data: CanvasMouseEvent) {
        if (!this._isPanning) {
            return
        }

        const { e, canvas } = data
        this.cursorService.setCursor(this.cursorToolName, 'panning')

        canvas.translateX = (e.clientX - this.startPanX) / canvas.zoom
        canvas.translateY = (e.clientY - this.startPanY) / canvas.zoom

        canvas.requestRender()
    }

    onMouseUp() {
        if (this._isPanning) {
            this._isPanning = false
            this.cursorService.setCursor(this.cursorToolName, 'pan')
        }
    }

    reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    dispose() {}
}
