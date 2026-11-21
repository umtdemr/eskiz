import {
    Canvas,
    Point,
    setCanvasStyles,
    sizeCanvas,
} from '@/core/canvas/Canvas.ts'
import { WsEngine } from '@/core/WsEngine.ts'
import { ISyncAdapter } from '@/core/sync/ISyncAdapter.ts'
import { WsAdapter } from '@/core/sync/WsAdapter.ts'
import { LocalAdapter } from '@/core/sync/LocalAdapter.ts'
import { UpperCanvasRenderer } from '@/core/renderers/UpperCanvasRenderer.ts'
import { Stage } from '../stage/Stage'
import { LTRBRect } from '../geometry/BoundingBox'
import {
    easeInOutCubic,
    fitView,
    interpolateView,
    View,
} from '../geometry/math'
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
import {
    CommandParams,
    CommandRegistry,
    Commands,
} from '../command/CommandRegistry'
import { ContinuousEdits } from '../command/ContinuousEdits'
import { ExecuteOptions, KeyInput } from '../command/Command'
import { HistoryManager } from '../history/HistoryManager'
import { ShortcutService } from '../services/ShortcutService'
import { MagnetService } from '../services/MagnetService'
import { ImageLoadingService } from '../services/ImageLoadingService'
import { ImageUploadService } from '@/core/services/ImageUploadService'
import { TextureManager } from '../services/TextureManager'

import { StickyNoteToolService } from '../services/StickyNoteToolService'
import { DuplicationService } from '../services/DuplicationService'
import { ClipboardService } from '../services/ClipboardService'
import { ExportService } from '../services/ExportService'

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
    // frame of the running view animation, 0 when there is none
    private viewAnimation = 0
    private isAnimatingView = false
    private _dragHandler: DragHandler
    private _resizeHandler: ResizeHandler
    private _reshapeHandler: ReshapeHandler
    private _rotateHandler: RotateHandler
    private _transactionHandler: TransactionHandler
    private _continuousEdits: ContinuousEdits
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
        this._continuousEdits = new ContinuousEdits(this)
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
        upperCanvasEl.id = 'upperCanvas'
        this.canvas.canvasEl.parentNode!.appendChild(upperCanvasEl)

        this._upperCanvasEl = upperCanvasEl
        setCanvasStyles(this._upperCanvasEl)
        this.sizeUpperCanvas()
        this.canvas.resized.add(this.sizeUpperCanvas, this)

        this._mouseController.start(this)
        this.getService<WheelService>('wheel')?.start()

        // assign upper canvas el to upper canvas renderer
        this.upperCanvasRenderer.upperCanvasEl = this._upperCanvasEl
        this.upperCanvasRenderer.run() // start rendering upper canvas

        this.canvasInitiated.dispatch(this.canvas)
        this.initialized.dispatch()
        return true
    }

    private sizeUpperCanvas() {
        const dpr = this.canvas.dpr
        sizeCanvas(this._upperCanvasEl, dpr)
        // resizing resets the 2d context
        this._upperCanvasEl.getContext('2d')?.scale(dpr, dpr)
        this.upperCanvasRenderer.requestRender()
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
        this.stopViewAnimation()
        this.canvas.resized.remove(this.sizeUpperCanvas, this)
        this.canvas.dispose()
        this.wsEngine?.dispose()
        this.getService<ShortcutService>('shortcut').dispose()
        this.getService<ClipboardService>('clipboard').dispose()
        this._mouseController.dispose()
        this.zoomChanged.removeAll()
    }

    // fits `rect` on the screen. the padding leaves room for toolbars on the
    // sides, `maxZoom` keeps a small area from filling the screen
    zoomToBounds(
        rect: LTRBRect,
        { padding = 96, maxZoom = 1, animate = false } = {},
    ) {
        const view = fitView(
            rect,
            this.canvas.width,
            this.canvas.height,
            padding,
            maxZoom,
        )
        if (animate) {
            this.animateView(view)
        } else {
            this.setView(view)
        }
    }

    // shows every widget, does nothing on an empty board
    zoomToFit(options?: {
        padding?: number
        maxZoom?: number
        animate?: boolean
    }) {
        const bounds = this.stage.contentBounds()
        if (bounds) this.zoomToBounds(bounds, options)
    }

    // moving the view any other way, like a wheel or a pan, stops it
    animateView(view: View, { duration = 400 } = {}) {
        this.stopViewAnimation()

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        if (reduced || duration <= 0) {
            this.setView(view)
            return
        }

        const from = {
            zoom: this.canvas.zoom,
            translateX: this.canvas.translateX,
            translateY: this.canvas.translateY,
        }
        const start = performance.now()

        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const { width, height } = this.canvas

            this.isAnimatingView = true
            this.setView(
                interpolateView(from, view, easeInOutCubic(t), width, height),
            )
            this.isAnimatingView = false

            if (t < 1) {
                this.viewAnimation = requestAnimationFrame(step)
            } else {
                this.stopViewAnimation()
            }
        }

        this.canvas.transform.add(this.onViewMoved, this)
        this.viewAnimation = requestAnimationFrame(step)
    }

    stopViewAnimation() {
        if (!this.viewAnimation) return
        cancelAnimationFrame(this.viewAnimation)
        this.viewAnimation = 0
        this.canvas.transform.remove(this.onViewMoved, this)
    }

    private onViewMoved() {
        if (!this.isAnimatingView) this.stopViewAnimation()
    }

    private setView(view: View) {
        this.canvas.zoom = view.zoom
        this.canvas.translateX = view.translateX
        this.canvas.translateY = view.translateY

        this.canvas.requestRender()
        this.zoomChanged.dispatch(this.canvas.zoom)
    }

    zoomTo(targetZoom: number) {
        // zoom around viewport center
        this.zoomAt(targetZoom, window.innerWidth / 2, window.innerHeight / 2)
    }

    // keeps the screen point x, y in place, then pans by dx, dy screen pixels
    zoomAt(targetZoom: number, x: number, y: number, dx = 0, dy = 0) {
        const oldScale = this.canvas.zoom
        this.canvas.zoom = targetZoom
        const newScale = this.canvas.zoom

        this.canvas.translateX =
            x / newScale - x / oldScale + this.canvas.translateX + dx / oldScale
        this.canvas.translateY =
            y / newScale - y / oldScale + this.canvas.translateY + dy / oldScale

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
        this.serviceManager.register(
            'shortcut',
            new ShortcutService(this, this._mouseController),
        )

        // skip collaborative-only services in standalone mode
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
        this.serviceManager.register(
            'clipboard',
            new ClipboardService(this, this._mouseController),
        )
        this.serviceManager.register('export', new ExportService(this))
    }

    getService<T>(name: string): T {
        return this.serviceManager.get<T>(name)
    }

    getCommand<K extends Commands>(cmd: K) {
        return this._commands.get(cmd)
    }

    execute<K extends Commands>(
        name: K,
        params: CommandParams[K],
        options?: ExecuteOptions,
    ): boolean {
        return this._commands.execute(this, name, params, options)
    }

    // true when a command is bound to the keys
    executeShortcut(input: KeyInput): boolean {
        return this._commands.executeShortcut(this, input)
    }

    get commandExecuted() {
        return this._commands.executed
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

    get continuousEdits(): ContinuousEdits {
        return this._continuousEdits
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
