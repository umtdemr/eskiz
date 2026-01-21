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
import { Widget } from '@/core/shapes/Widget'

export class LineToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private line: Line | null = null
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.SHAPE_DRAWER_TOOL
    private selectionService: SelectionService
    private currentScanResult: {
        nearbyWidget: Widget | null
        snappedPoint: { x: number; y: number } | null
        snappedPointIndex: number
        isInside: boolean
    } | null = null

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

        let scanResult = this.currentScanResult

        // first click without move
        if (!scanResult) {
            const magnetService =
                this.engine.getService<MagnetService>('magnet')
            scanResult = magnetService.scan({ x, y })
        }

        if (
            scanResult &&
            scanResult.nearbyWidget &&
            scanResult.nearbyWidget.canSnap() &&
            (scanResult.snappedPoint || scanResult.isInside)
        ) {
            const widget = scanResult.nearbyWidget
            let rx = 0
            let ry = 0
            let startX = x
            let startY = y

            if (scanResult.snappedPoint) {
                const { rx: newRx, ry: newRy } = widget.getRelativeFromPoint(
                    scanResult.snappedPoint.x,
                    scanResult.snappedPoint.y,
                )
                rx = newRx
                ry = newRy
                startX = scanResult.snappedPoint.x
                startY = scanResult.snappedPoint.y
            } else {
                const { rx: newRx, ry: newRy } = widget.getRelativeFromPoint(
                    x,
                    y,
                )
                rx = newRx
                ry = newRy
            }

            this.line.tailBinding = {
                id: widget.uuid!,
                rx,
                ry,
            }
            this.line.tailBindingWidget = widget
            widget.addAttachedLine(this.line)

            // adjust start point to snapped or relative point
            const points = this.line.points
            points[0] = [startX, startY]
            points[1] = [startX, startY]
            this.line.setPoints(points)
        }

        this.engine.stage.addWidget(this.line)
    }

    private onMouseMove(data: CanvasMouseEvent) {
        const { x, y } = data.pointer
        const startPoint = this.line?.points[0]

        // check for magnetic snapping
        const magnetService = this.engine.getService<MagnetService>('magnet')
        const magnetLayer =
            this.engine.stage.nonCanvasDynamicContainer.magnetLayer

        const scanResult = magnetService.scan({ x, y })
        this.currentScanResult = scanResult
        const { nearbyWidget, snappedPoint, snappedPointIndex } = scanResult

        let targetX = x
        let targetY = y

        if (snappedPoint) {
            targetX = snappedPoint.x
            targetY = snappedPoint.y
        }

        magnetLayer.update(nearbyWidget, snappedPointIndex)

        if (this.line) {
            this.line.setPoints([startPoint!, [targetX, targetY]])
        }

        this.engine.canvas.requestRender()
    }

    private onMouseUp() {
        if (!this.line) return
        this.line.setBoundsFromPoints()

        this.selectionService.selectWidget(this.line)

        const uuid = nanoid()
        this.line.uuid = uuid

        const scanResult = this.currentScanResult

        if (
            scanResult &&
            scanResult.nearbyWidget &&
            scanResult.nearbyWidget.canSnap() &&
            (scanResult.snappedPoint || scanResult.isInside)
        ) {
            const widget = scanResult.nearbyWidget
            let rx = 0
            let ry = 0

            if (scanResult.snappedPoint) {
                const { rx: newRx, ry: newRy } = widget.getRelativeFromPoint(
                    scanResult.snappedPoint.x,
                    scanResult.snappedPoint.y,
                )
                rx = newRx
                ry = newRy
            } else {
                const absPoints = this.line.absolutePoints
                const absEnd = absPoints[absPoints.length - 1]
                const { rx: newRx, ry: newRy } = widget.getRelativeFromPoint(
                    absEnd[0],
                    absEnd[1],
                )
                rx = newRx
                ry = newRy
            }

            this.line.headBinding = {
                id: widget.uuid!,
                rx,
                ry,
            }
            this.line.headBindingWidget = widget
            widget.addAttachedLine(this.line)
        }

        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, this.line),
        )

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
        this.currentScanResult = null
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
