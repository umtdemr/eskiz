import { Service } from './Service'
import { Engine, CanvasMouseEvent } from '../engine/Engine'
import { MouseController } from '../engine/MouseController'
import { MainModeChangedState, ToolService } from './ToolService'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { CursorService } from './CursorService'
import { CursorType } from '@/core/constants.ts'
import { SelectionService } from './SelectionService'
import {
    DEFAULT_HEIGHT,
    DEFAULT_WIDTH,
    StickyNote,
} from '@/core/shapes/stickyNote/StickyNote'
import { nanoid } from 'nanoid'
import { WidgetsService } from '@/core/services/WidgetsService.ts'
import { AddWidgetPayload } from '@/types/Websocket.ts'
import { CreationHistoryEntry } from '@/core/history/HistoryManager'

export class StickyNoteToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private selectionService: SelectionService
    private cursorService: CursorService
    private cursorToolName = CURSOR_OWNERS.STICKY_NOTE_TOOL

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
        selectionService: SelectionService,
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        this.selectionService = selectionService
        this.cursorService = this.engine.getService<CursorService>('cursor')

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.reset()
        if (state.tool === ACTION_MODES.STICKY_NOTE) {
            this.init()
        }
    }

    private init() {
        this.cursorService.setCursor(this.cursorToolName, CursorType.STICKY_NOTE)
        this.mouseController.on('mouseDown', this.onMouseDown, this)
    }

    private reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
    }

    private onMouseDown(data: CanvasMouseEvent) {
        const { x, y } = data.pointer

        const stickyNote = new StickyNote(
            {
                x: x - DEFAULT_WIDTH / 2,
                y: y - DEFAULT_HEIGHT / 2,
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT,
                uuid: nanoid(),
                properties: {},
            },
            this.engine,
        )

        this.engine.stage.addWidget(stickyNote)
        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, stickyNote),
        )

        // add to db
        // TODO: phase 2 - check error
        const widgetsService = this.engine.getService<WidgetsService>('widgets')
        const json = { ...stickyNote.toJson(), page_id: this.engine.pageId }
        widgetsService.addWidget(json as AddWidgetPayload)

        this.toolService.changeTool(ACTION_MODES.SELECT)
        this.selectionService.selectWidget(stickyNote)
    }

    dispose(): void {
        this.reset()
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
    }
}
