import { CanvasMouseEvent, Engine } from "../engine/Engine";
import { MouseController } from "../engine/MouseController";
import { Rectangle } from "../shapes/Rectangle";
import { Shape } from "../shapes/Shape";
import { Service } from "./Service";
import { Ellipse } from "../shapes/Ellipse";
import { Triangle } from "../shapes/Triangle"; 
import { SubModeChangedState, ToolService } from "./ToolService";
import { ACTION_MODES, SUB_ACTION_MODES, DRAWING_MODES } from "@/helpers/Constant";
import { SelectionService } from "./SelectionService";

export class ShapeDrawerToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private selectionService: SelectionService
    private shape: Shape|null = null
    private drawingStarted: boolean = false;
    private initialPosition: { x: number, y: number } = { x: 0, y: 0 }
    private drawingMode: keyof typeof DRAWING_MODES | null;
    
    constructor(engine: Engine, mouseController: MouseController, toolService: ToolService, selectionService: SelectionService) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        this.selectionService = selectionService

        this.toolService.subModeChanged.add(this.onSubModeChanged, this)
    }

    private init() {
        this.engine.upperCanvasEl.style.cursor = 'crosshair'

        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private onSubModeChanged(state: SubModeChangedState) {
        this.reset();

        if (
            (
                state.subTool === SUB_ACTION_MODES.CREATE_RECTANGLE ||
                state.subTool === SUB_ACTION_MODES.CREATE_TRIANGLE ||
                state.subTool === SUB_ACTION_MODES.CREATE_ELLIPSE
            ) && state.tool === ACTION_MODES.CREATE
        ) {
            this.init();
            this.drawingMode = state.subTool
        }
    }

    /**
     * Starts drawing a shape based on pointer
     * @param data
     * @param engine
     */
    onMouseDown(data: CanvasMouseEvent) {
        // if drawing mode is not there
        if (!this.drawingMode) {
            return;
        }
    
        this.initialPosition = {
            x: data.pointer.x,
            y: data.pointer.y,
        }

        let shapeConstructor
        if (this.drawingMode === DRAWING_MODES.CREATE_RECTANGLE) {
            shapeConstructor = Rectangle
        } else if (this.drawingMode === DRAWING_MODES.CREATE_TRIANGLE) {
            shapeConstructor = Triangle
        } else if (this.drawingMode === DRAWING_MODES.CREATE_ELLIPSE) {
            shapeConstructor = Ellipse
        }

        if (shapeConstructor) {
            this.shape = new shapeConstructor({
                x: data.pointer.x,
                y: data.pointer.y,
                width: 1,
                height: 1,
                parentLayer: this.engine.stage.widgetsDefaultLayer
            })
            this.engine.stage.addWidget(this.shape!)
            this.drawingStarted = true;
        } 
    }

    /**
     * Handles changing width and height during shape drawing
     * @param data
     * @param engine
     */
    onMouseMove(data: CanvasMouseEvent) {
        if (!this.shape) return
        const { canvas } = data

        // change width and height
        this.shape.width = Math.abs(data.pointer.x - this.initialPosition.x)
        this.shape.height = Math.abs(data.pointer.y - this.initialPosition.y)
        
        // grow shape equally when shift key is being pressed
        if (data.e.shiftKey) {
            const maxSide = Math.max(this.shape.width, this.shape.height)
            this.shape.width = this.shape.height = maxSide
        }

        // align x and y
        if (data.pointer.x > this.initialPosition.x) {
            this.shape.left = this.initialPosition.x
        } else {
            this.shape.right = this.initialPosition.x
        }
        
        if (data.pointer.y > this.initialPosition.y) {
            this.shape.top = this.initialPosition.y
        } else {
            this.shape.bottom = this.initialPosition.y
        }
        
        canvas?.requestRender()
    }

    onMouseUp() {
        // todo: can find a better solution to delay this
        setTimeout(() => {
            this.toolService.changeTool(ACTION_MODES.SELECT)
        }, 0)
        if (this.shape) {
            this.selectionService.selectWidget(this.shape)
        }
        this.reset()
    }
    
    private reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
        this.shape = null
        this.drawingStarted = false
        this.drawingMode = null;
    }

    dispose(): void {
        this.reset();
    }

    /**
     * If true, in next mouse down drawer will start drawing.
     */
    get isDrawerActive() {
        return this.drawingStarted
    }
}