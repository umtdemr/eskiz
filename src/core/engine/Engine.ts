import { Canvas, Point, setCanvasStyles } from '@/core/canvas/Canvas.ts'
import { WsEngine } from '@/core/WsEngine.ts'
import { UpperCanvasRenderer } from '@/core/renderers/UpperCanvasRenderer.ts'
import { Emitter } from '@/core/emitter/Emitter.ts'
import { Stage } from '../stage/Stage'
import { ServiceManager } from '../services/ServiceManager'
import { SelectionService } from '../services/SelectionService'
import { MouseController } from './MouseController'
import { SelectToolService } from '../services/SelectToolService'
import { ShapeDrawerToolService } from '../services/ShapeDrawerToolService'
import { PanToolService } from '../services/PanToolService'
import { CursorSenderService } from '../services/CursorSenderService'
import { ToolService } from '../services/ToolService'
import { Signal } from '../signal/Signal'
import { WheelService } from '../services/WheelService'
import { WebsocketEventService } from '@/core/services/WebsocketEventService.ts'
import { BoardNameService } from '@/core/services/BoardNameService.ts'
import { CollaboratorsService } from '@/core/services/CollaboratorsService.ts'
import { WidgetsService } from '@/core/services/WidgetsService.ts'
import { PageService } from '@/core/services/PageService.ts'
import { CursorService } from '@/core/services/CursorService.ts'
import { DragHandler } from '@/core/controls/DragHandler'
import { ResizeHandler } from '@/core/controls/ResizeHandler'
import { TransactionHandler } from '@/core/transaction/TransactionHandler'
import { PathToolService } from '@/core/services/PathToolService'
import { TextBox } from '../shapes/TextBox'
import { Rectangle } from '../shapes/Rectangle'
import { TextService } from '../services/TextService'

export type CanvasMouseEvent = {
    e: MouseEvent
    pointer: Point
    canvas: Canvas
}

export type EngineEventsMap = {
    zoom: number
}

export class Engine extends Emitter<EngineEventsMap> {
    // TODO: remove slug and board id here for SST
    private _slugId: string
    private _boardId: number
    private _pageId: number
    private: string
    private _mouseController: MouseController
    private _upperCanvasEl: HTMLCanvasElement
    private _stage: Stage
    canvas: Canvas
    wsEngine: WsEngine
    private serviceManager: ServiceManager
    private _isRunning = false
    private _dragHandler: DragHandler
    private _resizeHandler: ResizeHandler
    private _transactionHandler: TransactionHandler

    upperCanvasRenderer: UpperCanvasRenderer

    stagesInitiated = new Signal()
    canvasInitiated = new Signal<Canvas>()
    initialized = new Signal()

    constructor(slugId: string, boardId: number, pageId: number) {
        super()
        this._slugId = slugId
        this._boardId = boardId
        this._pageId = pageId
        this.wsEngine = new WsEngine(
            import.meta.env.VITE_WS_URL,
            this._slugId,
            this._boardId,
            this._pageId,
        )

        this._transactionHandler = new TransactionHandler(this.wsEngine)
        this._dragHandler = new DragHandler(this)
        this._resizeHandler = new ResizeHandler(this)
        this._mouseController = new MouseController()
        this.serviceManager = new ServiceManager()
        this.initializeServices()

        this._stage = new Stage(this)
        this.canvas = new Canvas(this._stage)

        this.upperCanvasRenderer = new UpperCanvasRenderer()

        this.stage.widgetsDefaultLayer.addChildren(
            new TextBox({
                x: 200,
                y: 200,
                width: 800,
                properties: {
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin venenatis quam sit amet velit condimentum mattis. Etiam quis pellentesque massa. Duis sagittis volutpat ultricies. Proin aliquet enim placerat justo facilisis, ac ornare nunc molestie. Nunc elit eros, fermentum in dignissim eu, condimentum nec tortor. Maecenas quis eleifend massa, quis fringilla sem. Integer vitae nulla quis lectus semper iaculis id eget ipsum. Proin ullamcorper posuere nunc sit amet facilisis. Quisque et posuere lorem. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Pellentesque vitae tortor ac mauris consectetur tincidunt vitae vel augue. Etiam hendrerit massa sed accumsan accumsan. Suspendisse id convallis dolor.',
                    fontSize: 18,
                },
            }),
        )
        this.stagesInitiated.dispatch()
    }

    async initialize() {
        await this.canvas.initialize()
        await this.wsEngine.initialize()

        // create upper canvas
        const upperCanvasEl = document.createElement('canvas')
        upperCanvasEl.width = this.canvas.canvasEl.width
        upperCanvasEl.height = this.canvas.canvasEl.height
        upperCanvasEl.id = 'upperCanvas'
        this.canvas.canvasEl.parentNode!.appendChild(upperCanvasEl)

        this._upperCanvasEl = upperCanvasEl
        setCanvasStyles(this._upperCanvasEl)

        this._mouseController.start(this)
        this.getService<WheelService>('wheel')?.start()

        // assign upper canvas el to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this._upperCanvasEl
        this.upperCanvasRenderer.run() // start rendering upper canvas

        this.canvasInitiated.dispatch(this.canvas)
        this.initialized.dispatch()
        return true
    }

    run() {
        if (this._isRunning) {
            return
        }
        this.canvas.draw()
        this.canvas.requestRender()
        this._isRunning = true
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
        const wsEventService = new WebsocketEventService(this)
        const toolService = new ToolService(this)
        const selectionService = new SelectionService(this, toolService)
        // cursor service is responsible of handling cursor changes

        this.serviceManager.register('wsEventService', wsEventService)
        this.serviceManager.register('toolService', toolService)
        this.serviceManager.register('cursor', new CursorService(this))
        this.serviceManager.register('selection', selectionService)
        this.serviceManager.register(
            'selectTool',
            new SelectToolService(this, this._mouseController, toolService),
        )
        this.serviceManager.register(
            'panTool',
            new PanToolService(this, this._mouseController, toolService),
        )
        this.serviceManager.register(
            'wheel',
            new WheelService(this, this._mouseController),
        )
        this.serviceManager.register(
            'shapeDrawer',
            new ShapeDrawerToolService(
                this,
                this._mouseController,
                toolService,
                selectionService,
            ),
        )
        this.serviceManager.register(
            'pathTool',
            new PathToolService(this, this._mouseController, toolService),
        )
        this.serviceManager.register(
            'text',
            new TextService(
                this,
                this._mouseController,
                toolService,
                selectionService,
            ),
        )
        // cursorSender service sends user's cursor position to the server
        this.serviceManager.register(
            'cursorSender',
            new CursorSenderService(this, this.wsEngine, this._mouseController),
        )
        this.serviceManager.register(
            'boardName',
            new BoardNameService(this, wsEventService),
        )
        this.serviceManager.register(
            'collaborators',
            new CollaboratorsService(this, wsEventService),
        )
        this.serviceManager.register('page', new PageService(this))
        this.serviceManager.register(
            'widgets',
            new WidgetsService(this, wsEventService),
        )
    }

    getService<T>(name: string): T {
        return this.serviceManager.get<T>(name)
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

    get dragHandler(): DragHandler {
        return this._dragHandler
    }

    get resizeHandler(): ResizeHandler {
        return this._resizeHandler
    }

    get transactionHandler(): TransactionHandler {
        return this._transactionHandler
    }
}
