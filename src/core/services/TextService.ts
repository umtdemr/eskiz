import { MouseController } from '@/core/engine/MouseController'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Service } from '@/core/services/Service'
import { MainModeChangedState, ToolService } from '@/core/services/ToolService'
import { CursorService } from '@/core/services/CursorService.ts'
import { CURSOR_OWNERS, ACTION_MODES } from '@/helpers/Constant'
import { TextBox } from '@/core/shapes/text/TextBox'
import {
    SelectionChangedProps,
    SelectionService,
} from '@/core/services/SelectionService'
import {
    TextChangedSignal,
    TextEditingSession,
    TextEditor,
} from '@/core/textEditor/TextEditor'
import { Shape } from '@/core/shapes/Shape'
import { Widget, WidgetClickedSignal } from '@/core/shapes/Widget'
import { EditingMethods } from '@/core/transaction/State'
import { nanoid } from 'nanoid'
import { WidgetsService } from './WidgetsService'
import { AddWidgetPayload } from '@/types/Websocket'
import { CursorType, TextAlign, TextSessionType } from '@/core/constants.ts'

export class TextService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private cursorService: CursorService
    private selectionService: SelectionService
    private cursorToolName = CURSOR_OWNERS.TEXT_SERVICE
    private textEditor: TextEditor
    private textBox: TextBox
    private shape: Shape
    private activeSession: TextEditingSession | null
    private isTextboxCreatedWithService: boolean
    private isTextboxSavedInDb: boolean
    private transactionId: string | null

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService,
        selectionService: SelectionService,
    ) {
        super(engine)

        this.mouseController = mouseController
        this.toolService = toolService
        this.cursorService = this.engine.getService<CursorService>('cursor')
        this.selectionService = selectionService

        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
        this.textEditor = this.engine.textEditor

        this.selectionService.selectionChanged.add(
            this.onSelectionChanged,
            this,
        )
        this.textEditor.editorBlurred.add(this.onEditorBlurred, this)
    }

    /**
     * Initialize events for creating individual textbox
     */
    private init() {
        this.cursorService.setCursor(this.cursorToolName, CursorType.TEXT)
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        this.reset()

        if (state.tool === ACTION_MODES.TEXT) {
            this.init()
        }
    }

    private reset() {
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    private onMouseDown(data: CanvasMouseEvent) {}
    private onMouseMove(data: CanvasMouseEvent) {}
    private onMouseUp(data: CanvasMouseEvent) {
        const textbox = new TextBox({
            x: data.pointer.x,
            y: data.pointer.y,
            width: 200,
            uuid: nanoid(),
            properties: {
                text: 'Type to something',
                fontSize: 14,
                isPlaceholder: true,
            },
        })

        this.engine.stage.addWidget(textbox)

        // arrange center
        textbox.top = textbox.top - textbox.height / 2

        this.textEditor.showEditor({
            x: textbox.centerX,
            y: textbox.centerY,
            width: textbox.width,
            height: textbox.height,
            fontSize: textbox.fontSize,
            lineHeight: textbox.lineHeight,
            for: TextSessionType.TEXTBOX,
            textAlign: TextAlign.LEFT,
            showPlaceholder: true,
        })

        this.textBox = textbox
        this.isTextboxCreatedWithService = true // flag for identifying if the textbox is created just now
        this.textBox.hideText() // hide text when text editor is active
        this.textBox.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)

        this.selectionService.selectWidget(textbox)
        this.activeSession = TextSessionType.TEXTBOX
        this.toolService.changeTool(ACTION_MODES.SELECT)
    }

    private initializeTransaction() {
        const editTable = new Map<Widget, EditingMethods[]>()
        if (this.activeSession === TextSessionType.SHAPE_TEXT) {
            editTable.set(this.shape, ['text'])
        }
        if (this.activeSession === TextSessionType.TEXTBOX) {
            editTable.set(this.textBox, ['text'])
        }

        if (!editTable.size) return

        const { transactionId } = this.engine.transactionHandler.begin(
            'continuous',
            { editTable },
        )

        this.transactionId = transactionId
    }

    private onTextChanged(props: TextChangedSignal) {
        // replace one \n to avoid +1 line issue
        const trimmedText = props.text.replace(/\n$/, '')

        if (this.activeSession === TextSessionType.TEXTBOX && this.textBox) {
            // if textbox is newly created by this service, add it to the db
            if (this.isTextboxCreatedWithService && !this.isTextboxSavedInDb) {
                this.isTextboxSavedInDb = true
                const uuid = nanoid()
                const widgetsService =
                    this.engine.getService<WidgetsService>('widgets')
                this.textBox.uuid = uuid
                const json = {
                    ...this.textBox?.toJson(),
                    page_id: this.engine.pageId,
                }

                // todo (transaction): check error, if necessary delete from canvas
                widgetsService.addWidget(json as AddWidgetPayload)
                this.initializeTransaction()
            }

            this.textBox.setTextOps(trimmedText, props.textOps)

            // sync text editor dimensions with text box
            this.textEditor.updateSize({
                width: this.textBox.width,
                height: this.textBox.height,
                x: this.textBox.centerX,
                y: this.textBox.centerY,
            })
            this.engine.canvas.requestRender()
        } else if (this.activeSession === TextSessionType.SHAPE_TEXT && this.shape) {
            this.shape.updateText(props.text, props.textOps)
        }

        if (this.transactionId) {
            this.engine.transactionHandler.update(this.transactionId)
        }
    }

    private handleEditorSessionFinish() {
        if (!this.activeSession) {
            return
        }

        this.textEditor.hideEditor()

        if (this.activeSession === 'textBox' && this.textBox) {
            // if text is not saved in db, remove it from the canvas
            if (this.isTextboxCreatedWithService && !this.isTextboxSavedInDb) {
                this.engine.stage.widgetsDefaultLayer.removeChild(this.textBox)
            } else {
                // otherwise render the actual textbox
                this.textBox.showText()
            }
        } else if (this.activeSession === 'shapeText' && this.shape) {
            this.shape.finishEditingText()
        }

        this.engine.canvas.requestRender()

        this.activeSession = null
        if (this.transactionId) {
            this.engine.transactionHandler.commit(this.transactionId)
        }
        this.transactionId = null
        this.isTextboxCreatedWithService = false
        this.isTextboxSavedInDb = false
    }

    private onDeselected() {
        this.handleEditorSessionFinish()
    }

    private onEditorBlurred() {
        this.handleEditorSessionFinish()
    }

    private onSelectionChanged(props: SelectionChangedProps) {
        if (props.type !== 'selected') {
            return
        }

        if (!props.widgets || props.widgets.length > 1) {
            return
        }

        const widget = props.widgets[0]
        if (widget instanceof Shape) {
            this.shape = widget

            this.shape.clicked.add(this.onWidgetClicked, this)
        } else if (widget instanceof TextBox) {
            this.textBox = widget

            this.textBox.clicked.add(this.onWidgetClicked, this)
        }
    }

    private onShapeClicked() {
        const bounds = this.shape.calcTextBounds()

        this.textEditor.showEditor({
            x: bounds.x + this.shape.left,
            y: bounds.y + this.shape.top,
            width: bounds.width,
            height: bounds.height,
            fontSize: this.shape.textProperties?.fontSize ?? 14,
            lineHeight: this.shape.textProperties?.lineHeight ?? 1.4,
            textAlign: this.shape.textProperties?.textAlign ?? 'center',
            for: 'shapeText',
            showPlaceholder: false,
            initialText: this.shape.textStr,
            textOps: this.shape?.textProperties?.textOps || [],
        })

        this.shape.startEditingText()

        this.shape.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.activeSession = 'shapeText'
        this.engine.canvas.requestRender()
    }

    private onTextboxClicked() {
        this.textEditor.showEditor({
            initialText: this.textBox.textStr,
            textOps: this.textBox.textPropsJson.textOps,
            x: this.textBox.centerX,
            y: this.textBox.centerY,
            width: this.textBox.width,
            height: this.textBox.height,
            fontSize: this.textBox.fontSize,
            lineHeight: this.textBox.lineHeight,
            for: 'textBox',
            textAlign: 'left',
        })

        this.activeSession = 'textBox'
        this.textBox.hideText()
        this.textBox.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.engine.canvas.requestRender()
    }

    private onWidgetClicked(data: WidgetClickedSignal) {
        if (data.widget instanceof Shape) {
            this.onShapeClicked()
        } else if (data.widget instanceof TextBox) {
            this.onTextboxClicked()
        }
        this.initializeTransaction()
    }

    dispose(): void {
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
        this.reset()
    }
}
