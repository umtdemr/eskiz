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

// TODO: remove event listeners
export class TextService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private cursorService: CursorService
    private selectionService: SelectionService
    private cursorToolName = CURSOR_OWNERS.TEXT_SERVICE
    private textEditor: TextEditor
    private textBox: TextBox
    private shape: Shape
    private activeSession: TextEditingSession

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
    }

    /**
     * Initialize events for creating individual textbox
     */
    private init() {
        this.cursorService.setCursor(this.cursorToolName, 'text')
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
            properties: {
                text: 'Type to something',
                fontSize: 14,
                isPlaceholder: true,
            },
        })

        this.engine.stage.widgetsDefaultLayer.addChildren(textbox)

        // arrange center
        textbox.top = textbox.top - textbox.height / 2

        this.textEditor.showEditor({
            x: textbox.centerX,
            y: textbox.centerY,
            width: textbox.width,
            height: textbox.height,
            fontSize: textbox.fontSize,
            lineHeight: textbox.lineHeight,
            for: 'textBox',
            textAlign: 'left',
        })

        this.textBox = textbox
        this.textBox.hideText() // hide text when text editor is active
        this.textBox.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)

        this.selectionService.tempSelectWidget(textbox)
        this.activeSession = 'textBox'
        this.toolService.changeTool(ACTION_MODES.SELECT)
    }

    private onTextChanged(props: TextChangedSignal) {
        // replace one \n to avoid +1 line issue
        const trimmedText = props.text.replace(/\n$/, '')

        if (this.activeSession === 'textBox' && this.textBox) {
            this.textBox.setText(trimmedText)

            // sync text editor dimensions with text box
            this.textEditor.updateSize({
                width: this.textBox.width,
                height: this.textBox.height,
                x: this.textBox.centerX,
                y: this.textBox.centerY,
            })
            this.engine.canvas.requestRender()
        } else if (this.activeSession === 'shapeText' && this.shape) {
            this.shape.updateText(trimmedText)
        }
    }

    private onDeselected() {
        this.textEditor.hideEditor()
        if (this.activeSession === 'textBox' && this.textBox) {
            this.textBox.showText()
        } else if (this.activeSession === 'shapeText' && this.shape) {
            this.shape.finishEditingText()
        }
    }

    private onSelectionChanged(props: SelectionChangedProps) {
        if (props.type === 'tempSelected') {
            return
        }

        if (props.type === 'selected') {
            if (!props.widgets || props.widgets.length > 1) {
                return
            }

            const widget = props.widgets[0]
            if (!(widget instanceof Shape)) {
                return
            }

            this.shape = widget

            this.shape.clicked.add(this.onShapeClicked, this)
        }
    }

    private onShapeClicked() {
        const bounds = this.shape.calcTextBounds()

        this.textEditor.showEditor({
            x: bounds.x + this.shape.left,
            y: bounds.y + this.shape.top,
            width: bounds.width,
            height: bounds.height,
            fontSize: 14,
            lineHeight: 1.4,
            textAlign: 'center',
            for: 'shapeText',
            showPlaceholder: false,
        })

        this.shape.startEditingText()

        this.shape.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)
        this.activeSession = 'shapeText'
    }

    dispose(): void {
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
        this.reset()
    }
}
