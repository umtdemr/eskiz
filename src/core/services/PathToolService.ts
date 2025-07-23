import { Service } from '@/core/services/Service'
import { SubModeChangedState, ToolService } from '@/core/services/ToolService'
import { SelectionService } from '@/core/services/SelectionService'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { MouseController } from '@/core/engine/MouseController'
import { Path } from '@/core/shapes/path/Path'
import {
    ACTION_MODES,
    CURSOR_OWNERS,
    SUB_ACTION_MODES,
} from '@/helpers/Constant'
import { CursorService } from '@/core/services/CursorService'
import { useBoundStore } from '@/store/store'

export class PathToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private selectionService: SelectionService
    private path: Path | null = null
    private drawingStarted: boolean = false
    private initialPosition: { x: number; y: number } = { x: 0, y: 0 }
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.PATH_TOOL

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
        selectionService: SelectionService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        this.selectionService = selectionService

        this.toolService.subModeChanged.add(this.onSubModeChanged, this)
        this.cursorService = this.engine.getService<CursorService>('cursor')
    }

    private init() {
        this.cursorService.setCursor(this.cursorToolName, 'crosshair')
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private onSubModeChanged(state: SubModeChangedState) {
        this.reset()

        if (
            state.subTool === SUB_ACTION_MODES.DRAW_PEN &&
            state.tool === ACTION_MODES.CREATE
        ) {
            this.init()
        } else {
            this.dispose()
        }
    }

    private onMouseDown(data: CanvasMouseEvent) {
        this.initialPosition = {
            x: data.pointer.x,
            y: data.pointer.y,
        }

        // TODO: need to use a package for drawing
        const { thickness, color } = useBoundStore.getState().pen

        this.path = new Path({
            x: data.pointer.x,
            y: data.pointer.y,
            width: 1,
            height: 1,
            parentLayer: this.engine.stage.widgetsDefaultLayer,
            properties: {
                strokeWidth: thickness,
                strokeColor: color,
            },
        })
        this.path.path.moveTo(0, 0)
        this.engine.stage.addWidget(this.path!)
    }

    private onMouseMove(data: CanvasMouseEvent) {
        if (!this.path) {
            return
        }

        this.path.path.lineTo(
            data.pointer.x - this.path.left,
            data.pointer.y - this.path.top,
        )
        this.engine.canvas.requestRender()
    }
    private onMouseUp() {
        if (!this.path) {
            return
        }

        const bounds = this.path.path.getBounds()
        this.path.width = bounds[2]
        this.path.height = bounds[3]
        this.reset()
    }

    private reset() {
        this.path = null
        this.drawingStarted = false
    }

    dispose(): void {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
        this.reset()
    }
}
