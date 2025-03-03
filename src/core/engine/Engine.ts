import {Canvas, Point, setCanvasStyles} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";
import {WheelEvent} from "react";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";
import {Emitter} from "@/core/emitter/Emitter.ts";
import { Stage } from "../stage/Stage";
import { ServiceManager } from '../services/ServiceManager';
import { SelectionService } from '../services/SelectionService';
import { MouseController } from "./MouseController";
import { SelectToolService } from "../services/SelectToolService";
import { ShapeDrawerToolService } from "../services/ShapeDrawerToolService";
import { Signal } from "signals";
import { PanToolService } from "../services/PanToolService";
import { CursorSenderService } from "../services/CursorSenderService";

export type CanvasMouseEvent = {
    e: MouseEvent
    pointer: Point
    canvas: Canvas
}

export type EngineEventsMap = {
    'modeChange': CanvasMode
    'zoom': number,
}

export type CanvasMainModes = 'neutral' | 'pan' | 'create'

// can be used determining sub modes for main modes. For example, main mode can be `create` and sub mode can be `createRectangle`
export type CanvasSubModes = 'createRectangle' | 'createTriangle' | 'createEllipse'

export type CanvasMode = {
    mainMode: CanvasMainModes,
    subMode?: CanvasSubModes
}


export class Engine extends Emitter<EngineEventsMap>{
    private _slugId: string
    private _mouseController: MouseController
    private _upperCanvasEl: HTMLCanvasElement
    private _activeMode: CanvasMode = { mainMode: 'neutral' };
    private _stage: Stage
    canvas: Canvas
    wsEngine: WsEngine
    private serviceManager: ServiceManager;

    upperCanvasRenderer: UpperCanvasRenderer

    stagesInitiated = new Signal()
    
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
        this.onMouseWheel = this.onMouseWheel.bind(this);
        
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
        
        this.setEventHandlers()
        this._mouseController.start(this)

        // assign upper canvas el to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this._upperCanvasEl
        this.upperCanvasRenderer.run() // start rendering upper canvas
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

    /**
     * Sets new mode.
     * @param newMainMode - New main mode.
     * @param newSubMode - New sub mode.
     */
    changeActiveMode(newMainMode: CanvasMainModes, newSubMode?: CanvasSubModes) {
        const shouldEmit = newMainMode !== this._activeMode.mainMode || newSubMode !== this._activeMode.subMode
        this._activeMode = {
            mainMode: newMainMode,
            subMode: newSubMode
        };
        if (shouldEmit) {
            this.emit('modeChange', { mainMode: newMainMode, subMode: newSubMode })
        }
    }
    private setEventHandlers() {
        // @ts-ignore
        this._upperCanvasEl.addEventListener('wheel', this.onMouseWheel);
    }
    
    private onMouseWheel(e: WheelEvent) {
        e.preventDefault();

        // zooming should be activated with ctrl key
        if (!e.ctrlKey) {
            return
        }
        const mouseX = e.clientX
        const mouseY = e.clientY;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const oldScale = this.canvas.zoom;
        this.canvas.zoom = Math.min(Math.max(ZOOM_LEVELS.MIN, this.canvas.zoom * zoomFactor), ZOOM_LEVELS.MAX);

        this.canvas.translateX = mouseX / this.canvas.zoom - mouseX / oldScale + this.canvas.translateX;
        this.canvas.translateY = mouseY / this.canvas.zoom - mouseY / oldScale + this.canvas.translateY;

        this.canvas.requestRender()
        this.emit('zoom', this.canvas.zoom)
    }
    
    private initializeServices() {
        this.serviceManager.register('selection', new SelectionService(this));
        this.serviceManager.register('selectTool', new SelectToolService(this, this._mouseController));
        this.serviceManager.register('panTool', new PanToolService(this, this._mouseController));
        this.serviceManager.register('shapeDrawer', new ShapeDrawerToolService(this, this._mouseController));
        this.serviceManager.register('cursorSender', new CursorSenderService(this, this.wsEngine, this._mouseController));
    }

    getService<T>(name: string): T {
        return this.serviceManager.get<T>(name);
    }

    get activeMode() {
        return this._activeMode
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