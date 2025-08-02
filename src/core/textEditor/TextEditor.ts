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
    private _initialEditProps: EditProps

    textChanged = new Signal<TextChangedSignal>()

    constructor(engine: Engine) {
        this.engine = engine

        // add wrapper
        const wrapper = document.createElement('div')
        wrapper.classList.add('text-editor-wrapper')
        wrapper.style.position = 'fixed'
        wrapper.style.left = '-9999px'
        wrapper.style.top = '-9999px'
        wrapper.style.transformOrigin = 'center center'

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

        const neww = this.engine.canvas.transformPoint(
            {
                x: this._initialEditProps.x,
                y: this._initialEditProps.y,
            },
            transform,
        )
        this._wrapperEl.style.left = `${neww.x - this._initialEditProps.width / 2}px`
        this._wrapperEl.style.top = `${neww.y - this._initialEditProps.height / 2}px`
        const scale = this.engine.canvas.zoom
        this._wrapperEl.style.transform = `scale(${scale})`
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

    updateSize(props: Pick<EditProps, 'width' | 'height'>) {
        this._wrapperEl.style.width = `${props.width}px`
        this._wrapperEl.style.height = `${props.height}px`
        this._quill.root.style.height = `${props.height}px`
        this.setPosition()
    }

    showEditor(props: EditProps) {
        this._initialEditProps = props
        this.engine.canvas.transform.add(this.onCanvasTransform, this)

        this._wrapperEl.style.display = 'block'
        this._wrapperEl.style.width = `${props.width}px`
        this._wrapperEl.style.height = `${props.height}px`

        this._editorContainer.style.height = `${props.height}px`
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
