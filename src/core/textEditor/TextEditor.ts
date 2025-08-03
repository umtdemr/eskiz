import Quill from 'quill'
import { Engine } from '@/core/engine/Engine'
import { Signal } from '@/core/signal/Signal'

interface EditProps {
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    lineHeight: number
}

export interface TextChangedSignal {
    text: string
}

export class TextEditor {
    private engine: Engine
    private _wrapperEl: HTMLDivElement
    private _editorContainer: HTMLDivElement
    private _quill: Quill
    private _isShowing = false
    private _editProps: EditProps

    textChanged = new Signal<TextChangedSignal>()

    constructor(engine: Engine) {
        this.engine = engine

        // add wrapper
        const wrapper = document.createElement('div')
        wrapper.classList.add('text-editor-wrapper')
        wrapper.style.position = 'fixed'
        wrapper.style.left = '-9999px'
        wrapper.style.top = '-9999px'
        wrapper.style.transformOrigin = 'left top'

        this._wrapperEl = wrapper
        document.body.appendChild(this._wrapperEl)

        // initialize quill
        this._editorContainer = this._wrapperEl.appendChild(
            this._wrapperEl.ownerDocument.createElement('div'),
        )

        this._quill = new Quill(this._editorContainer, {
            debug: false,
            placeholder: 'Type to something',
        })

        // bind listener
        this.onTextChange = this.onTextChange.bind(this)
    }

    private setPosition() {
        const transform = this.engine.canvas.viewportTransform

        const transformedPosition = this.engine.canvas.transformPoint(
            {
                x: this._editProps.x,
                y: this._editProps.y,
            },
            transform,
        )
        const scale = this.engine.canvas.zoom
        this._wrapperEl.style.transform = `scale(${scale})`
        this._editorContainer.style.height = `${this._editProps.height}px`
        this._wrapperEl.style.width = `${this._editProps.width}px`
        this._wrapperEl.style.height = `${this._editProps.height}px`
        this._wrapperEl.style.left = `${transformedPosition.x - (this._editProps.width * scale) / 2}px`
        this._wrapperEl.style.top = `${transformedPosition.y - (this._editProps.height * scale) / 2}px`
        this._quill.root.style.height = `${this._editProps.height}px`
    }

    private onCanvasTransform() {
        this.setPosition()
    }

    private initalizeListeners() {
        this._quill.on('text-change', this.onTextChange)
    }
    private removeListeners() {
        this._quill.off('text-change', this.onTextChange)
    }

    private onTextChange() {
        this.textChanged.dispatch({ text: this._quill.getText() })
    }

    updateSize(props: Pick<EditProps, 'width' | 'height' | 'x' | 'y'>) {
        this._editProps.x = props.x
        this._editProps.y = props.y
        this._editProps.width = props.width
        this._editProps.height = props.height
        this.setPosition()
    }

    showEditor(props: EditProps) {
        this._editProps = props
        this.engine.canvas.transform.add(this.onCanvasTransform, this)

        this._wrapperEl.style.display = 'block'

        this._editorContainer.style.fontSize = `${props.fontSize}px`
        this._editorContainer.style.lineHeight = `${props.lineHeight * props.fontSize}px`
        this._quill.root.style.height = `${props.height}px`

        this.setPosition()

        this._quill.focus()
        this._isShowing = true

        this.initalizeListeners()
    }

    hideEditor() {
        this._wrapperEl.style.display = 'none'
        this._isShowing = false
        this.removeListeners()
    }
}
