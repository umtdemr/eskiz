import { getStroke } from 'perfect-freehand'
import { Service } from '@/core/services/Service'
import { SubModeChangedState, ToolService } from '@/core/services/ToolService'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { MouseController } from '@/core/engine/MouseController'
import { Path } from '@/core/shapes/path/Path'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { CursorService } from '@/core/services/CursorService'
import { useBoundStore } from '@/store/store'
import { canvasKit } from '../canvas/Canvas'
import { Pen } from '../shapes/path/Pen'
import { RGBA } from '../shapes/Color'
import { TrailLayer } from '@/core/stage/TrailLayer'
import { nanoid } from 'nanoid'
import { WidgetsService } from './WidgetsService'
import { AddWidgetPayload } from '@/types/Websocket'
import { getSvgPathFromStroke } from '../shapes/path/pathUtils'
import { SelectionService } from './SelectionService'
import { CursorType, PathToolType } from '@/core/constants.ts'
import { CreationHistoryEntry } from '@/core/history/HistoryManager'

export class PathToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private path: Path | null = null
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.PATH_TOOL
    private points: number[][] = []
    private penState: {
        color?: RGBA
        thickness?: number
    } = {}
    private activePathTool: (typeof PathToolType)[keyof typeof PathToolType]
    private trailLayer: TrailLayer
    private deletedShapesWithEraser: Map<string, Pen> = new Map()

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService

        this.toolService.subModeChanged.add(this.onSubModeChanged, this)
        this.engine.stagesInitiated.add(this.onStagesInitiated, this)
        this.cursorService = this.engine.getService<CursorService>('cursor')
    }

    private init() {
        this.cursorService.setCursor(this.cursorToolName, CursorType.CROSSHAIR)
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private onStagesInitiated() {
        this.trailLayer = this.engine.stage.nonCanvasDynamicContainer.trailLayer
    }

    private onSubModeChanged(state: SubModeChangedState) {
        this.reset()
        this.removeListeners()

        if (state.tool === ACTION_MODES.PATH) {
            this.deletedShapesWithEraser.clear()

            if (state.subTool === 'DRAW_PEN') {
                this.activePathTool = PathToolType.PEN
            } else if (state.subTool === 'ERASER') {
                this.activePathTool = PathToolType.ERASER
            }
            this.init()
        } else {
            this.dispose()
        }
    }

    private onMouseDown(data: CanvasMouseEvent) {
        if (this.activePathTool === PathToolType.ERASER) {
            const widget = this.searchPenShapes(data)
            if (widget) {
                this.startDeletingPenWidget(widget)
            }

            this.trailLayer.start(data.pointer.x, data.pointer.y)
            return
        }

        const { thickness, color } = useBoundStore.getState().pen
        this.penState.thickness = thickness
        this.penState.color = color

        this.path = new Pen(
            {
                x: data.pointer.x,
                y: data.pointer.y,
                width: 1,
                height: 1,
                parentLayer: this.engine.stage.widgetsDefaultLayer,
                properties: {
                    color: color!,
                    points: [[data.pointer.x, data.pointer.y]],
                    strokeWidth: thickness,
                },
            },
            this.engine,
        )
        this.points[0] = [data.pointer.x, data.pointer.y]
        this.engine.stage.addWidget(this.path!)
    }

    private onMouseMove(data: CanvasMouseEvent) {
        if (this.activePathTool === 'eraser') {
            this.trailLayer.update(data.pointer.x, data.pointer.y)
            const widget = this.searchPenShapes(data)
            if (widget) {
                this.startDeletingPenWidget(widget)
            }
            return
        }

        if (!this.path) {
            return
        }
        this.points.push([data.pointer.x, data.pointer.y])

        const stroke = getStroke(this.points, {
            size: this.penState.thickness,
        })

        // generate path from svg
        const svg = getSvgPathFromStroke(stroke)
        const pathFromSvg = canvasKit.Path.MakeFromSVGString(svg)!

        // paths bound should always start from 0, 0
        // that's I implemented this invert transform
        const newBounds = pathFromSvg.getBounds()
        const transformMatrix = canvasKit.Matrix.translated(
            -newBounds[0],
            -newBounds[1],
        )
        pathFromSvg.transform(transformMatrix)

        this.path.left = newBounds[0]
        this.path.top = newBounds[1]
        this.path.width = newBounds[2] - newBounds[0]
        this.path.height = newBounds[3] - newBounds[1]

        this.path.replacePath(pathFromSvg!, this.points)
        this.engine.canvas.requestRender()
    }
    private onMouseUp() {
        if (this.activePathTool === 'eraser') {
            this.trailLayer.finish()
            // if there are widgets deleted by eraser tool, send them to db
            if (this.deletedShapesWithEraser.size) {
                // TODO: we may require setting visible as true for undo-redo

                const widgets = [...this.deletedShapesWithEraser.values()]
                // we will change isDeleted in widget state to true
                // so, visible should be true to avoid issues in history manager
                for (const widget of widgets) {
                    widget.visible = true
                }
                const selectionService =
                    this.engine.getService<SelectionService>('selection')
                const command = this.engine.getCommand('delete')
                command.execute({
                    selectionService,
                    engine: this.engine,
                    params: {
                        widgets,
                    },
                })

                this.deletedShapesWithEraser.clear()
            }
            return
        }
        if (!this.path) {
            return
        }

        if (this.path instanceof Pen) {
            const uuid = nanoid()
            const widgetsService =
                this.engine.getService<WidgetsService>('widgets')
            this.path.uuid = uuid
            const json = {
                ...this.path?.toJson(),
                page_id: this.engine.pageId,
            }

            // todo (transaction): check error, if necessary delete from canvas
            widgetsService.addWidget(json as AddWidgetPayload)
            this.engine.historyManager.push(
                new CreationHistoryEntry(this.engine, this.path),
            )
        }
        this.reset()
    }

    private reset() {
        this.path = null
        this.points = []
        this.deletedShapesWithEraser.clear()
    }

    private removeListeners() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    private searchPenShapes(mouseData: CanvasMouseEvent): Pen | null {
        const layer = this.engine.stage.widgetsDefaultLayer
        if (layer.children.length === 0) return null
        const pointer = mouseData.pointer

        for (const widget of layer.children) {
            if (!(widget instanceof Pen)) continue
            if (!widget.uuid) continue
            if (widget.isDeleted) continue

            // if already deleted, skip
            if (this.deletedShapesWithEraser.has(widget.uuid)) continue
            if (widget.bounds.contains(pointer.x, pointer.y)) {
                return widget
            }
        }
        return null
    }

    private startDeletingPenWidget(penShape: Pen) {
        this.deletedShapesWithEraser.set(penShape.uuid!, penShape)

        // hide it
        penShape.visible = false
    }

    dispose(): void {
        this.removeListeners()
        this.reset()
    }
}
