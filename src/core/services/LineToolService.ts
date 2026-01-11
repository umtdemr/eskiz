import { Service } from '@/core/services/Service'
import { MainModeChangedState, ToolService } from '@/core/services/ToolService'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { MouseController } from '@/core/engine/MouseController'
import { Line } from '@/core/shapes/line/Line'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { CursorService } from '@/core/services/CursorService'
import { CursorType } from '@/core/constants.ts'
import { SelectionService } from './SelectionService'
import { nanoid } from 'nanoid'
import { WidgetsService } from '@/core/services/WidgetsService.ts'
import { AddWidgetPayload } from '@/types/Websocket.ts'
import { CreationHistoryEntry } from '@/core/history/HistoryManager'
import { MagnetService } from './MagnetService'

export class LineToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private line: Line | null = null
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.SHAPE_DRAWER_TOOL
    private selectionService: SelectionService

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

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
        this.cursorService = this.engine.getService<CursorService>('cursor')
    }

    private init() {
        this.cursorService.setCursor(this.cursorToolName, CursorType.CROSSHAIR)
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.reset()
        this.removeListeners()

        if (state.tool === ACTION_MODES.LINE) {
            this.init()
        } else {
            this.dispose()
        }
    }

    private onMouseDown(data: CanvasMouseEvent) {
        const { x, y } = data.pointer

        this.line = new Line({
            width: 0,
            x: 0,
            y: 0,
            parentLayer: this.engine.stage.widgetsDefaultLayer,
            properties: {
                hasHeadArrow: true,
                points: [
                    [x, y],
                    [x, y],
                    // TODO: add stroke color and width later
                ],
            },
        })

        this.engine.stage.addWidget(this.line)
    }

    private onMouseMove(data: CanvasMouseEvent) {
        if (!this.line) return
        const { x, y } = data.pointer
        const startPoint = this.line.points[0]

        // check for magnetic snapping
        const magnetService = this.engine.getService<MagnetService>('magnet')
        const magnetLayer =
            this.engine.stage.nonCanvasDynamicContainer.magnetLayer

        const scanResult = magnetService.scan({ x, y })
        const { nearbyWidget, snappedPoint, snappedPointIndex } = scanResult

        let targetX = x
        let targetY = y

        if (snappedPoint) {
            targetX = snappedPoint.x
            targetY = snappedPoint.y
        }

        magnetLayer.update(nearbyWidget, snappedPointIndex)

        this.line.setPoints([startPoint, [targetX, targetY]])
        this.engine.canvas.requestRender()
    }

    private onMouseUp() {
        if (!this.line) return
        this.line.setBoundsFromPoints()

        this.selectionService.selectWidget(this.line)

        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, this.line),
        )

        const uuid = nanoid()
        this.line.uuid = uuid
        const widgetsService = this.engine.getService<WidgetsService>('widgets')

        const json = { ...this.line.toJson(), page_id: this.engine.pageId }

        widgetsService.addWidget(json as AddWidgetPayload)

        this.engine.stage.nonCanvasDynamicContainer.magnetLayer.update(null)
        this.engine.canvas.requestRender()

        this.toolService.changeTool(ACTION_MODES.SELECT)

        this.reset()
    }

    private reset() {
        this.line = null
    }

    private removeListeners() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    dispose(): void {
        this.removeListeners()
        this.reset()
    }
}
