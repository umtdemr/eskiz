import {Canvas, CanvasMouseEvent} from "@/core/canvas/Canvas.ts";
import {WsEngine} from "@/core/WsEngine.ts";
import {COLLAB_CURSOR_THROTTLING_TIME} from "@/helpers/Constant.ts";
import {UpperCanvasRenderer} from "@/core/renderers/UpperCanvasRenderer.ts";
import {ShapeDrawer} from "@/core/engine/ShapeDrawer.ts";

export class Engine {
    private _slugId: string
    canvas: Canvas
    wsEngine: WsEngine
    private collabCursorLastSend: number
    private collabCursorSendingTimeout: number
    private _isPanning = false;
    private startPanX = 0;
    private startPanY = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private shapeDrawer: ShapeDrawer
    upperCanvasRenderer: UpperCanvasRenderer
    
    constructor(slugId: string) {
        this._slugId = slugId
        this.canvas = new Canvas(this._slugId)
        this.upperCanvasRenderer = new UpperCanvasRenderer();
        this.wsEngine = new WsEngine(import.meta.env.VITE_WS_URL, this._slugId)
        this.canvasMouseDownHandler = this.canvasMouseDownHandler.bind(this)
        this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this)
        this.canvasMouseUpHandler = this.canvasMouseUpHandler.bind(this)
        this.shapeDrawer = new ShapeDrawer()
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

    dispose() {
        this.canvas.dispose()
        this.wsEngine.dispose()
    }
    
    private canvasMouseDownHandler(data: CanvasMouseEvent) {
        const { e } = data
        if (this.canvas.activeMode.mainMode === 'pan') {
            this._isPanning = true;
            this.startPanX = e.clientX - this.canvas.translateX * this.canvas.zoom;
            this.startPanY = e.clientY - this.canvas.translateY * this.canvas.zoom;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.upperCanvas.style.cursor = 'grabbing';
            return
        }
        
        if (this.canvas.activeMode.mainMode === 'create' && this.canvas.activeMode.subMode) {
            this.shapeDrawer.startDrawing(data, this.canvas)
        }
    }
    
    private canvasMouseMoveHandler(data: CanvasMouseEvent) {
        const { e } = data;
        // handle panning
        if (this.canvas.activeMode.mainMode === 'pan' && this._isPanning) {
            this.canvas.translateX = (e.clientX - this.startPanX) / this.canvas.zoom;
            this.canvas.translateY = (e.clientY - this.startPanY) / this.canvas.zoom;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.requestRender()
        }
        
        // handle shape drawing
        if (this.shapeDrawer.isDrawerActive) {
            this.shapeDrawer.handleDrawing(data)
        }
        
        // handle collaborator cursor
        const time = Date.now()
        clearTimeout(this.collabCursorSendingTimeout) // clear old attempts to sync data
        const collabCursorSender = this.sendCollabCursorData.bind(this)

        if (!this.collabCursorLastSend || time > this.collabCursorLastSend + COLLAB_CURSOR_THROTTLING_TIME) {
            this.collabCursorLastSend = time
            collabCursorSender(data);
        } else {
            // send collab cursor data after some time to sync last data
            this.collabCursorSendingTimeout = setTimeout(() => {
                collabCursorSender(data)
            }, COLLAB_CURSOR_THROTTLING_TIME)
        }
    }
    
    private canvasMouseUpHandler(data: CanvasMouseEvent) {
        if (this._isPanning) {
            this._isPanning = false;
            this.canvas.upperCanvas.style.cursor = 'grab';
        }

        if (this.shapeDrawer.isDrawerActive) {
            this.shapeDrawer.stopDrawing()
            this.canvas.changeActiveMode('neutral') // go back to normal mode after drawing is completed
        }
    }
    
    private sendCollabCursorData(data: CanvasMouseEvent) {
        this.wsEngine.sendMessage<"cursor">(
        {
                type: 'cursor', 
                data: {
                    x: data.pointer.x, 
                    y: data.pointer.y, 
                }
            }
        )
    }
}