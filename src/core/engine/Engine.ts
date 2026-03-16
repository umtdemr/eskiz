import { Canvas, Point, setCanvasStyles } from '@/core/canvas/Canvas.ts'
import { WsEngine } from '@/core/WsEngine.ts'
import { ISyncAdapter } from '@/core/sync/ISyncAdapter.ts'
import { WsAdapter } from '@/core/sync/WsAdapter.ts'
import { LocalAdapter } from '@/core/sync/LocalAdapter.ts'
import { UpperCanvasRenderer } from '@/core/renderers/UpperCanvasRenderer.ts'
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
import { ReshapeHandler } from '@/core/controls/ReshapeHandler'
import { RotateHandler } from '@/core/controls/RotateHandler'
import { TransactionHandler } from '@/core/transaction/TransactionHandler'
import { PathToolService } from '@/core/services/PathToolService'
import { LineToolService } from '@/core/services/LineToolService'
import { TextService } from '../services/TextService'
import { TextEditor } from '../textEditor/TextEditor'
import { CommandRegistry } from '../command/CommandRegistry'
import { Command, Commands } from '../command/Command'
import { HistoryManager } from '../history/HistoryManager'
import { ShortcutService } from '../services/ShortcutService'
import { MagnetService } from '../services/MagnetService'
import { ImageLoadingService } from '../services/ImageLoadingService'
import { ImageUploadService } from '@/core/services/ImageUploadService'
import { TextureManager } from '../services/TextureManager'

import { StickyNoteToolService } from '../services/StickyNoteToolService'
import { DuplicationService } from '../services/DuplicationService'

export type CanvasMouseEvent = {
    e: MouseEvent
    pointer: Point
    canvas: Canvas
}

export type EngineEventsMap = {
    zoom: number
}

export class Engine {
    private _slugId: string
    private _boardId: number
    private _pageId: number
    private _mouseController: MouseController
    private _upperCanvasEl: HTMLCanvasElement
    private _stage: Stage
    canvas: Canvas
    wsEngine: WsEngine | null = null
    readonly isStandalone: boolean
    private serviceManager: ServiceManager
    private _isRunning = false
    private _dragHandler: DragHandler
    private _resizeHandler: ResizeHandler
    private _reshapeHandler: ReshapeHandler
    private _rotateHandler: RotateHandler
    private _transactionHandler: TransactionHandler
    private _textEditor: TextEditor
    private _commands: CommandRegistry
    private _historyManager: HistoryManager
    private _syncAdapter: ISyncAdapter

    upperCanvasRenderer: UpperCanvasRenderer

    stagesInitiated = new Signal()
    canvasInitiated = new Signal<Canvas>()
    initialized = new Signal()
    zoomChanged = new Signal<number>()

    constructor(slugId: string, boardId: number, pageId: number) {
        this._slugId = slugId
        this._boardId = boardId
        this._pageId = pageId
        this.isStandalone = import.meta.env.VITE_APP_MODE === 'standalone'

        if (this.isStandalone) {
            this._syncAdapter = new LocalAdapter()
        } else {
            this.wsEngine = new WsEngine(
                import.meta.env.VITE_WS_URL,
                this._slugId,
                this._boardId,
                this._pageId,
            )
            this._syncAdapter = new WsAdapter(this.wsEngine)
        }

        this._transactionHandler = new TransactionHandler(this)
        this._dragHandler = new DragHandler(this)
        this._resizeHandler = new ResizeHandler(this)
        this._reshapeHandler = new ReshapeHandler(this)
        this._rotateHandler = new RotateHandler(this)
        this._mouseController = new MouseController()
        this._textEditor = new TextEditor(this)
        this.serviceManager = new ServiceManager()
        this._commands = new CommandRegistry()
        this._historyManager = new HistoryManager(this)
        this.initializeServices()

        this._stage = new Stage(this)
        this.canvas = new Canvas(this._stage)

        this.upperCanvasRenderer = new UpperCanvasRenderer()

        this.stagesInitiated.dispatch()
    }

    async initialize() {
        await this.canvas.initialize()

        if (this.wsEngine) {
            await this.wsEngine.initialize()
        }

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
        this.wsEngine?.dispose()
        this._mouseController.dispose()
        this.zoomChanged.removeAll()
    }

    zoomTo(targetZoom: number) {
        const oldScale = this.canvas.zoom
        this.canvas.zoom = targetZoom
        const newScale = this.canvas.zoom

        // zoom around viewport center
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2

        this.canvas.translateX =
            centerX / newScale - centerX / oldScale + this.canvas.translateX
        this.canvas.translateY =
            centerY / newScale - centerY / oldScale + this.canvas.translateY

        this.canvas.requestRender()
        this.zoomChanged.dispatch(this.canvas.zoom)
    }

    private initializeServices() {
        const wsEventService = new WebsocketEventService(this)
        const toolService = new ToolService(this)
        const widgetsService = new WidgetsService(this, wsEventService)
        const selectionService = new SelectionService(
            this,
            toolService,
            widgetsService,
        )
        // cursor service is responsible of handling cursor changes

        this.serviceManager.register('wsEventService', wsEventService)
        this.serviceManager.register('toolService', toolService)
        this.serviceManager.register('cursor', new CursorService(this))
        this.serviceManager.register('selection', selectionService)
        this.serviceManager.register('widgets', widgetsService)
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
            'lineTool',
            new LineToolService(
                this,
                this._mouseController,
                toolService,
                selectionService,
            ),
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
        this.serviceManager.register('shortcut', new ShortcutService(this))

        // collaborative-only services — skip in standalone mode
        if (!this.isStandalone && this.wsEngine) {
            this.serviceManager.register(
                'cursorSender',
                new CursorSenderService(
                    this,
                    this.wsEngine,
                    this._mouseController,
                ),
            )
            this.serviceManager.register(
                'boardName',
                new BoardNameService(this, wsEventService),
            )
            this.serviceManager.register(
                'collaborators',
                new CollaboratorsService(this, wsEventService),
            )
        }
        this.serviceManager.register('page', new PageService(this))
        this.serviceManager.register('magnet', new MagnetService(this))
        const imageLoadingService = new ImageLoadingService(this)
        if (this.isStandalone) {
            imageLoadingService.setLocalAdapter(
                this._syncAdapter as LocalAdapter,
            )
        }
        this.serviceManager.register('imageLoadingService', imageLoadingService)
        this.serviceManager.register(
            'textureManager',
            new TextureManager(this, imageLoadingService),
        )
        this.serviceManager.register(
            'imageUpload',
            new ImageUploadService(this),
        )
        this.serviceManager.register(
            'stickyNoteTool',
            new StickyNoteToolService(
                this,
                this._mouseController,
                toolService,
                selectionService,
            ),
        )
        this.serviceManager.register(
            'duplication',
            new DuplicationService(this),
        )
    }

    getService<T>(name: string): T {
        return this.serviceManager.get<T>(name)
    }

    getCommand(cmd: Commands): Command {
        return this._commands.get(cmd)
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

    get reshapeHandler(): ReshapeHandler {
        return this._reshapeHandler
    }

    get rotateHandler(): RotateHandler {
        return this._rotateHandler
    }

    get transactionHandler(): TransactionHandler {
        return this._transactionHandler
    }

    get historyManager(): HistoryManager {
        return this._historyManager
    }

    get textEditor(): TextEditor {
        return this._textEditor
    }

    get pageId(): number {
        return this._pageId
    }

    get syncAdapter(): ISyncAdapter {
        return this._syncAdapter
    }

    get boardId(): number {
        return this._boardId
    }
}
