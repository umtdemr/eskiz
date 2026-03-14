import { MouseController } from '@/core/engine/MouseController'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Service } from '@/core/services/Service'
import { MainModeChangedState, ToolService } from '@/core/services/ToolService'
import { CursorService } from '@/core/services/CursorService.ts'
import { CURSOR_OWNERS, ACTION_MODES } from '@/helpers/Constant'
import { TextBox, TEXTBOX_MAX_CHARS } from '@/core/shapes/text/TextBox'
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
import { CreationHistoryEntry } from '@/core/history/HistoryManager'
import {
    StickyNote,
    STICKY_NOTE_MAX_CHARS,
} from '@/core/shapes/stickyNote/StickyNote'
import { SHAPE_MAX_CHARS } from '@/core/shapes/Shape'

export class TextService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private cursorService: CursorService
    private selectionService: SelectionService
    private cursorToolName = CURSOR_OWNERS.TEXT_SERVICE
    private textEditor: TextEditor
    private widget: Widget
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

    private onMouseDown(_data: CanvasMouseEvent) {}
    private onMouseMove(_data: CanvasMouseEvent) {}
    private onMouseUp(data: CanvasMouseEvent) {
        const textbox = new TextBox(
            {
                x: data.pointer.x,
                y: data.pointer.y,
                width: 200,
                uuid: nanoid(),
                properties: {
                    text: 'Type to something',
                    fontSize: 14,
                    isPlaceholder: true,
                },
            },
            this.engine,
        )

        this.engine.stage.addWidget(textbox)
        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, textbox),
        )

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
            maxLength: TEXTBOX_MAX_CHARS,
        })

        this.widget = textbox
        const widget = this.widget as TextBox
        this.isTextboxCreatedWithService = true // flag for identifying if the textbox is created just now
        widget.hideText() // hide text when text editor is active
        widget.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)

        this.selectionService.selectWidget(widget)
        this.activeSession = TextSessionType.TEXTBOX
        this.toolService.changeTool(ACTION_MODES.SELECT)
    }

    private initializeTransaction() {
        const editTable = new Map<Widget, EditingMethods[]>()

        editTable.set(this.widget, ['text'])

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

        if (
            this.activeSession === TextSessionType.TEXTBOX &&
            this.widget instanceof TextBox
        ) {
            // if textbox is newly created by this service, add it to the db
            if (this.isTextboxCreatedWithService && !this.isTextboxSavedInDb) {
                this.isTextboxSavedInDb = true
                const uuid = nanoid()
                const widgetsService =
                    this.engine.getService<WidgetsService>('widgets')
                this.widget.uuid = uuid
                const json = {
                    ...this.widget?.toJson(),
                    page_id: this.engine.pageId,
                }

                // todo (transaction): check error, if necessary delete from canvas
                widgetsService.addWidget(json as AddWidgetPayload)
                this.engine.historyManager.push(
                    new CreationHistoryEntry(this.engine, this.widget),
                )
                this.initializeTransaction()
            }

            this.widget.setTextOps(trimmedText, props.textOps)

            // sync text editor dimensions with text box
            this.textEditor.updateSize({
                width: this.widget.width / this.widget.scale,
                height: this.widget.height / this.widget.scale,
                x: this.widget.centerX,
                y: this.widget.centerY,
                fontSize: this.widget.fontSize,
                contentScale: this.widget.scale,
            })
            this.engine.canvas.requestRender()
        } else if (
            this.activeSession === TextSessionType.SHAPE_TEXT &&
            this.widget instanceof Shape
        ) {
            this.widget.updateText(props.text, props.textOps)
        } else if (
            this.activeSession === TextSessionType.STICKY_NOTE &&
            this.widget instanceof StickyNote
        ) {
            this.widget.updateText(props.text, props.textOps)

            // sync auto font size to the text editor
            if (this.widget.autoFontSize) {
                const newFontSize = this.widget.textProperties?.fontSize
                if (newFontSize) {
                    this.textEditor.changeFontSize(newFontSize)
                }
            }
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

        if (
            this.activeSession === 'textBox' &&
            this.widget instanceof TextBox
        ) {
            // if text is not saved in db, remove it from the canvas
            if (this.isTextboxCreatedWithService && !this.isTextboxSavedInDb) {
                this.engine.stage.widgetsDefaultLayer.removeChild(this.widget)
            } else {
                // otherwise render the actual textbox
                this.widget.showText()
            }
        } else if (
            this.activeSession === 'shapeText' &&
            this.widget instanceof Shape
        ) {
            this.widget.finishEditingText()
        } else if (
            this.activeSession === 'stickyNote' &&
            this.widget instanceof StickyNote
        ) {
            this.widget.finishEditingText()
        }

        this.engine.canvas.requestRender()

        this.activeSession = null
        if (this.transactionId) {
            this.engine.transactionHandler.commit(this.transactionId)
        }
        this.transactionId = null
        this.isTextboxCreatedWithService = false
        this.isTextboxSavedInDb = false

        this.widget.boundsChanged.remove(this.onWidgetBoundsChanged, this)
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
        if (
            widget instanceof Shape ||
            widget instanceof TextBox ||
            widget instanceof StickyNote
        ) {
            this.widget = widget
            this.widget.clicked.add(this.onWidgetClicked, this)
        }
    }

    private onWidgetClicked(data: WidgetClickedSignal) {
        if (data.widget instanceof Shape) {
            this.onShapeClicked()
        } else if (data.widget instanceof TextBox) {
            this.onTextboxClicked()
        } else if (data.widget instanceof StickyNote) {
            this.onStickyNoteClicked()
        }
        this.initializeTransaction()
        this.widget.boundsChanged.add(this.onWidgetBoundsChanged, this)
    }

    private onWidgetBoundsChanged() {
        if (
            !this.widget ||
            (!this.activeSession && this.activeSession === '')
        ) {
            return
        }

        if (this.widget instanceof Shape) {
            const bounds = this.widget.calcTextBounds()
            const props = {
                x: this.widget.left + bounds.x + bounds.width / 2,
                y: this.widget.top + bounds.y + bounds.height / 2,
                width: bounds.width,
                height: bounds.height,
                angle: this.widget.angle,
            }
            this.textEditor.updateSize(props)
            this.textEditor.focus()
        } else if (this.widget instanceof TextBox) {
            const textBox = this.widget as TextBox
            const props = {
                x: textBox.centerX,
                y: textBox.centerY,
                width: textBox.width / textBox.scale,
                height: textBox.height / textBox.scale,
                fontSize: textBox.fontSize,
                angle: textBox.angle,
                contentScale: textBox.scale,
            }
            this.textEditor.updateSize(props)
            this.textEditor.focus()
        } else if (this.widget instanceof StickyNote) {
            const bounds = this.widget.calcTextBounds()
            const contentScale = this.widget.getScaleFactor()

            const props = {
                x:
                    bounds.x * contentScale +
                    this.widget.left +
                    (bounds.width * contentScale) / 2,
                y:
                    bounds.y * contentScale +
                    this.widget.top +
                    (bounds.height * contentScale) / 2,
                width: bounds.width,
                height: bounds.height,
                contentScale,
                angle: this.widget.angle,
            }
            this.textEditor.updateSize(props)
            this.textEditor.focus()
        }
    }

    private onShapeClicked() {
        const shape = this.widget as Shape
        const bounds = shape.calcTextBounds()

        this.textEditor.showEditor({
            x: shape.left + bounds.x + bounds.width / 2,
            y: shape.top + bounds.y + bounds.height / 2,
            width: bounds.width,
            height: bounds.height,
            fontSize: shape.textProperties?.fontSize ?? 14,
            lineHeight: shape.textProperties?.lineHeight ?? 1.4,
            textAlign: shape.textProperties?.textAlign ?? 'center',
            for: 'shapeText',
            showPlaceholder: false,
            initialText: shape.textStr,
            textOps: shape?.textProperties?.textOps || [],
            maxLength: SHAPE_MAX_CHARS,
            angle: shape.angle,
        })

        shape.startEditingText()

        shape.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.activeSession = 'shapeText'
        this.engine.canvas.requestRender()
    }

    private onTextboxClicked() {
        const textBox = this.widget as TextBox
        this.textEditor.showEditor({
            initialText: textBox.textStr,
            textOps: textBox.textPropsJson.textOps,
            x: textBox.centerX,
            y: textBox.centerY,
            width: textBox.width / textBox.scale,
            height: textBox.height / textBox.scale,
            fontSize: textBox.fontSize,
            lineHeight: textBox.lineHeight,
            for: 'textBox',
            textAlign: 'left',
            maxLength: TEXTBOX_MAX_CHARS,
            angle: textBox.angle,
            contentScale: textBox.scale,
        })

        this.activeSession = 'textBox'
        textBox.hideText()
        textBox.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.engine.canvas.requestRender()
    }

    private onStickyNoteClicked() {
        const stickyNote = this.widget as StickyNote
        const bounds = stickyNote.calcTextBounds()
        const contentScale = stickyNote.getScaleFactor()
        const textColor = stickyNote.getTextColor()

        // map text ops to include the correct text color for the editor overlay
        const textOps = (stickyNote?.textProperties?.textOps || []).map(
            (op) => ({
                ...op,
                attributes: {
                    ...op.attributes,
                    color: textColor,
                },
            }),
        )

        this.textEditor.showEditor({
            x:
                bounds.x * contentScale +
                stickyNote.left +
                (bounds.width * contentScale) / 2,
            y:
                bounds.y * contentScale +
                stickyNote.top +
                (bounds.height * contentScale) / 2,
            width: bounds.width,
            height: bounds.height,
            fontSize: stickyNote.textProperties?.fontSize ?? 18,
            lineHeight: stickyNote.textProperties?.lineHeight ?? 1.4,
            textAlign: stickyNote.textProperties?.textAlign ?? 'left',
            for: 'stickyNote',
            showPlaceholder: false,
            initialText: stickyNote.textStr,
            textOps,
            contentScale,
            maxLength: STICKY_NOTE_MAX_CHARS,
            textColor,
            angle: stickyNote.angle,
        })

        stickyNote.startEditingText()

        stickyNote.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.activeSession = 'stickyNote'
        this.engine.canvas.requestRender()
    }

    dispose(): void {
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
        this.reset()
    }
}
