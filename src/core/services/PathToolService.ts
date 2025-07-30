import { getStroke } from 'perfect-freehand'
import { Service } from '@/core/services/Service'
import { SubModeChangedState, ToolService } from '@/core/services/ToolService'
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
import { canvasKit } from '../canvas/Canvas'
import { Pen } from '../shapes/path/Pen'
import { RGBA } from '../shapes/Color'

function med(A: number[], B: number[]) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
}

const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g

function getSvgPathFromStroke(points: number[][]): string {
    if (!points.length) {
        return ''
    }

    const max = points.length - 1

    return points
        .reduce(
            (acc, point, i, arr) => {
                if (i === max) {
                    acc.push(point, med(point, arr[0]), 'L', arr[0], 'Z')
                } else {
                    acc.push(point, med(point, arr[i + 1]))
                }
                return acc
            },
            ['M', points[0], 'Q'],
        )
        .join(' ')
        .replace(TO_FIXED_PRECISION, '$1')
}

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

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService

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
            state.tool === ACTION_MODES.PATH
        ) {
            this.init()
        } else {
            this.dispose()
        }
    }

    private onMouseDown(data: CanvasMouseEvent) {
        const { thickness, color } = useBoundStore.getState().pen
        this.penState.thickness = thickness
        this.penState.color = color

        this.path = new Pen({
            x: data.pointer.x,
            y: data.pointer.y,
            width: 1,
            height: 1,
            parentLayer: this.engine.stage.widgetsDefaultLayer,
            properties: {
                color: color!,
            },
        })
        this.points[0] = [data.pointer.x, data.pointer.y]
        this.engine.stage.addWidget(this.path!)
    }

    private onMouseMove(data: CanvasMouseEvent) {
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

        this.path.replacePath(pathFromSvg!)
        this.engine.canvas.requestRender()
    }
    private onMouseUp() {
        if (!this.path) {
            return
        }

        this.reset()
    }

    private reset() {
        this.path = null
        this.points = []
    }

    dispose(): void {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
        this.reset()
    }
}
