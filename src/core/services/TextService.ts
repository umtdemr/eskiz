import { MouseController } from '@/core/engine/MouseController'
import { CanvasMouseEvent, Engine } from '@/core/engine/Engine'
import { Service } from '@/core/services/Service'
import { MainModeChangedState, ToolService } from '@/core/services/ToolService'
import { CursorService } from '@/core/services/CursorService.ts'
import { CURSOR_OWNERS, ACTION_MODES } from '@/helpers/Constant'
import { Signal } from '@/core/signal/Signal'
import { TextBox } from '@/core/shapes/TextBox'
import { SelectionService } from '@/core/services/SelectionService'
import { TextChangedSignal, TextEditor } from '@/core/textEditor/TextEditor'

export class TextService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private cursorService: CursorService
    private selectionService: SelectionService
    private cursorToolName = CURSOR_OWNERS.TEXT_SERVICE
    private textEditor: TextEditor
    private textBox: TextBox

    // TODO: do I need?
    createText = new Signal<{ x: number; y: number }>()

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
    }

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
        })

        this.textBox = textbox
        this.textBox.hideText() // hide text when text editor is active
        this.textBox.deselected.addOnce(this.onDeselected, this)
        this.textEditor.textChanged.add(this.onTextChanged, this)

        this.selectionService.tempSelectWidget(textbox)
        this.toolService.changeTool(ACTION_MODES.SELECT)
    }

    private onTextChanged(props: TextChangedSignal) {
        // replace one \n to avoid +1 line issue
        const trimmedText = props.text.replace(/\n$/, '')

        this.textBox.setText(trimmedText)

        // sync text editor dimensions with text box
        // TODO: fix this
        /*this.textEditor.updateSize({
            width: this.textBox.width,
            height: this.textBox.height,
        })*/
        this.engine.canvas.requestRender()
    }

    private onDeselected() {
        this.textEditor.hideEditor()
        this.textBox.showText()
    }

    dispose(): void {
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
        this.reset()
    }
}
