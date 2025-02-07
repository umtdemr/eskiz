import {Canvas, Point, setCanvasStyles} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";
import {ShapeDrawerTool} from "@/core/tools/ShapeDrawerTool.ts";
import {Tool} from "@/core/tools/Tool.ts";
import {PanTool} from "@/core/tools/PanTool.ts";
import {CursorSenderTool} from "@/core/tools/CursorSenderTool.ts";
import {WheelEvent} from "react";
import {ZOOM_LEVELS} from "@/helpers/Constant.ts";
import {Emitter} from "@/core/emitter/Emitter.ts";
import {SelectTool} from "@/core/tools/SelectTool.ts";
import { Stage } from "../stage/Stage";

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
    private primaryTool: Tool | null = null;
    private alwaysActiveTools: Tool[] = [];
    private _upperCanvasEl: HTMLCanvasElement
    private _activeMode: CanvasMode = { mainMode: 'neutral' };
    private _stage: Stage
    canvas: Canvas
    wsEngine: WsEngine


    upperCanvasRenderer: UpperCanvasRenderer
    
    constructor(slugId: string) {
        super()
        this._slugId = slugId
        this._stage = new Stage();
        this.canvas = new Canvas(this._slugId, this._stage)

        this.upperCanvasRenderer = new UpperCanvasRenderer();
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.onMouseWheel = this.onMouseWheel.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        
        this.registerTool(new CursorSenderTool(), 'always-active')
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

        // assign upper canvas el to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this._upperCanvasEl
        this.upperCanvasRenderer.run() // start rendering upper canvas
        this.onModeChange()
        return true
    }
    
    run() {
        this.canvas.draw()
        this.canvas.requestRender()
    }

    registerTool(tool: Tool, type: 'primary' | 'always-active') {
        if (type === 'primary') {
            // Only one primary tool can exist
            this.primaryTool = tool;
        } else {
            this.alwaysActiveTools.push(tool);
        }
    }

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
        this._upperCanvasEl.removeEventListener('mousedown', this.onMouseDown)
        this._upperCanvasEl.removeEventListener('mousemove', this.onMouseMove);
        this._upperCanvasEl.removeEventListener('mouseup', this.onMouseUp);

        this.clearEventListeners() // remove eventListeners in Emitter class
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
            this.onModeChange()
        }
    }
    
    private onModeChange() {
        if (this._activeMode.mainMode === 'neutral') {
            this.registerTool(new SelectTool(), 'primary')
        } else if (this._activeMode.mainMode === 'pan') {
            this.registerTool(new PanTool(), 'primary')
            this.primaryTool = new PanTool()
        } else if (this._activeMode.mainMode === 'create' && this._activeMode.subMode) {
            this.registerTool(new ShapeDrawerTool(), 'primary')
        }
        
        this.primaryTool?.onActivate?.(this);
    }

    private setEventHandlers() {
        this._upperCanvasEl.addEventListener('mousedown', this.onMouseDown)
        this._upperCanvasEl.addEventListener('mousemove', this.onMouseMove);
        this._upperCanvasEl.addEventListener('mouseup', this.onMouseUp);
        // @ts-ignore
        this._upperCanvasEl.addEventListener('wheel', this.onMouseWheel);
    }
    
    private onMouseDown(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        if (this.primaryTool) {
            this.primaryTool.onMouseDown(wrappedMouseEvent, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseDown(wrappedMouseEvent, this);
        }        
    }
    
    private onMouseMove(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        if (this.primaryTool) {
            this.primaryTool.onMouseMove(wrappedMouseEvent, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseMove(wrappedMouseEvent, this);
        }
    }
    
    private onMouseUp(e: MouseEvent) {
        const wrappedMouseEvent = this.wrapMouseEvent(e)
        if (this.primaryTool) {
            this.primaryTool.onMouseUp(wrappedMouseEvent, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseUp(wrappedMouseEvent, this);
        }
    }

    private onMouseWheel(e: WheelEvent) {
        e.preventDefault();

        // zooming should be activated with ctrl key
        if (!e.ctrlKey) {
            return
        }
        const mouseX = e.clientX
        const mouseY = e.clientY;

        const zoomFactor = e.deltaY > 0 ? 0.5 : 1.6;
        const oldScale = this.canvas.zoom;
        this.canvas.zoom = Math.min(Math.max(ZOOM_LEVELS.MIN, this.canvas.zoom * zoomFactor), ZOOM_LEVELS.MAX);

        this.canvas.translateX = mouseX / this.canvas.zoom - mouseX / oldScale + this.canvas.translateX;
        this.canvas.translateY = mouseY / this.canvas.zoom - mouseY / oldScale + this.canvas.translateY;

        this.canvas.requestRender()
        this.emit('zoom', this.canvas.zoom)
    }
    
    private wrapMouseEvent(e: MouseEvent): CanvasMouseEvent {
        return { e, pointer: this.canvas.getPointer(e), canvas: this.canvas }
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