import {Canvas, CanvasMouseEvent} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";
import {ShapeDrawerTool} from "@/core/tools/ShapeDrawerTool.ts";
import {Tool} from "@/core/tools/Tool.ts";
import {PanTool} from "@/core/tools/PanTool.ts";
import {CursorSenderTool} from "@/core/tools/CursorSenderTool.ts";

export class Engine {
    private _slugId: string
    canvas: Canvas
    wsEngine: WsEngine
    private primaryTool: Tool | null = null;
    private alwaysActiveTools: Tool[] = [];
    upperCanvasRenderer: UpperCanvasRenderer
    
    constructor(slugId: string) {
        this._slugId = slugId
        this.canvas = new Canvas(this._slugId)
        this.upperCanvasRenderer = new UpperCanvasRenderer();
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.canvasMouseDownHandler = this.canvasMouseDownHandler.bind(this)
        this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this)
        this.canvasMouseUpHandler = this.canvasMouseUpHandler.bind(this)
        
        this.canvas.on('modeChange', mode => {
            if (mode.mainMode === 'pan') {
                this.registerTool(new PanTool(), 'primary')
                this.primaryTool = new PanTool()
            } else if (mode.mainMode === 'create' && mode.subMode) {
                this.registerTool(new ShapeDrawerTool(), 'primary')
            }
        })
        this.registerTool(new CursorSenderTool(), 'always-active')
    }
    
    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()
        this.canvas.on('mouseDown', this.canvasMouseDownHandler)
        this.canvas.on('mouseMove', this.canvasMouseMoveHandler)
        this.canvas.on('mouseUp', this.canvasMouseUpHandler)
        
        // assign upper canvas el from canvas instance to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this.canvas.upperCanvas
        this.upperCanvasRenderer.run() // start rendering upper canvas
        return true
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
    }
    
    private canvasMouseDownHandler(data: CanvasMouseEvent) {
        if (this.primaryTool) {
            this.primaryTool.onMouseDown(data, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseDown(data, this);
        }        
    }
    
    private canvasMouseMoveHandler(data: CanvasMouseEvent) {
        if (this.primaryTool) {
            this.primaryTool.onMouseMove(data, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseMove(data, this);
        }
    }
    
    private canvasMouseUpHandler(data: CanvasMouseEvent) {
        if (this.primaryTool) {
            this.primaryTool.onMouseUp(data, this);
        }

        for (const tool of this.alwaysActiveTools) {
            tool.onMouseUp(data, this);
        }
    }
}