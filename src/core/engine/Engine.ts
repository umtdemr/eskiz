import {Canvas, Point, setCanvasStyles} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";

import {Emitter} from "@/core/emitter/Emitter.ts";
import { Stage } from "../stage/Stage";
import { ServiceManager } from '../services/ServiceManager';
import { SelectionService } from '../services/SelectionService';
import { MouseController } from "./MouseController";
import { SelectToolService } from "../services/SelectToolService";
import { ShapeDrawerToolService } from "../services/ShapeDrawerToolService";
import { PanToolService } from "../services/PanToolService";
import { CursorSenderService } from "../services/CursorSenderService";
import { ToolService } from "../services/ToolService";
import { Signal } from "../signal/Signal";
import { WheelService } from "../services/WheelService";

export type CanvasMouseEvent = {
    e: MouseEvent
    pointer: Point
    canvas: Canvas
}

export type EngineEventsMap = {
    'zoom': number,
}

export class Engine extends Emitter<EngineEventsMap>{
    private _slugId: string
    private _mouseController: MouseController
    private _upperCanvasEl: HTMLCanvasElement
    private _stage: Stage
    canvas: Canvas
    wsEngine: WsEngine
    private serviceManager: ServiceManager;

    upperCanvasRenderer: UpperCanvasRenderer

    stagesInitiated = new Signal()
    canvasInitiated = new Signal<Canvas>()
    
    constructor(slugId: string) {
        super()
        this._slugId = slugId
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)

        this._mouseController = new MouseController()
        this.serviceManager = new ServiceManager();
        this.initializeServices();

        this._stage = new Stage(this);
        this.canvas = new Canvas(this._slugId, this._stage)

        this.upperCanvasRenderer = new UpperCanvasRenderer();
        
        this.stagesInitiated.dispatch()
    }
    
    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()

        // create upper canvas
        const upperCanvasEl = document.createElement('canvas')
        upperCanvasEl.width = this.canvas.canvasEl.width;
        upperCanvasEl.height = this.canvas.canvasEl.height;
        upperCanvasEl.id = 'upperCanvas'
        this.canvas.canvasEl.parentNode.appendChild(upperCanvasEl)

        this._upperCanvasEl = upperCanvasEl
        setCanvasStyles(this._upperCanvasEl)
        
        this._mouseController.start(this)
        this.getService<WheelService>('wheel')?.start()

        // assign upper canvas el to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this._upperCanvasEl
        this.upperCanvasRenderer.run() // start rendering upper canvas

        this.canvasInitiated.dispatch(this.canvas)
        return true
    }
    
    run() {
        this.canvas.draw()
        this.canvas.requestRender()
    }

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
        this._mouseController.dispose()

        this.clear() // remove eventListeners in Emitter class
    }
    
    setZoom(zoom: number) {
        this.canvas.zoom = zoom
        this.emit('zoom', this.canvas.zoom)
    }
    
    private initializeServices() {
        const toolService = new ToolService(this)
        const selectionService = new SelectionService(this, toolService);
        this.serviceManager.register('toolService', toolService);
        this.serviceManager.register('selection', selectionService);
        this.serviceManager.register('selectTool', new SelectToolService(this, this._mouseController, toolService));
        this.serviceManager.register('panTool', new PanToolService(this, this._mouseController, toolService));
        this.serviceManager.register('wheel', new WheelService(this, this._mouseController));
        this.serviceManager.register('shapeDrawer', new ShapeDrawerToolService(this, this._mouseController, toolService, selectionService));
        this.serviceManager.register('cursorSender', new CursorSenderService(this, this.wsEngine, this._mouseController));
    }

    getService<T>(name: string): T {
        return this.serviceManager.get<T>(name);
    }
    
    get upperCanvasEl() {
        return this._upperCanvasEl
    }

    /**
     * Getter for stage manager.
     */
    get stage() {
        return this._stage
    }
}