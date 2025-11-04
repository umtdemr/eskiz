import Quill, { Delta, Range as QRange } from 'quill'
import { Engine } from '@/core/engine/Engine'
import { Signal } from '@/core/signal/Signal'
import { TEXT_ALIGN } from '@/core/shapes/text/TextBox'

export type TextEditingSession = 'textBox' | 'shapeText'

interface EditProps {
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    lineHeight: number
    for: TextEditingSession
    textAlign: TEXT_ALIGN
    showPlaceholder?: boolean
    initialText?: string
}

export interface TextOp {
    text: string
    attributes: { [key: string]: unknown }
}

export interface TextChangedSignal {
    text: string
    textOps: TextOp[]
}

export class TextEditor {
    private engine: Engine
    private _wrapperEl: HTMLDivElement
    private _editorContainer: HTMLDivElement
    private _quill: Quill
    private _isShowing = false
    private _editProps: EditProps
    private _initialStylesHTML: [HTMLElement, string, string][] = []

    textChanged = new Signal<TextChangedSignal>()
    editorBlurred = new Signal()

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
        this.onEscape = this.onEscape.bind(this)

        this.addQuillBindings()
    }

    private addQuillBindings() {
        this._quill.keyboard.addBinding(
            {
                key: 'Escape',
            },
            this.onEscape,
        )
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

        if (this._editProps.for === 'textBox') {
            this._wrapperEl.style.left = `${transformedPosition.x - (this._editProps.width * scale) / 2}px`
            this._wrapperEl.style.top = `${transformedPosition.y - (this._editProps.height * scale) / 2}px`
            this._quill.root.style.height = `${this._editProps.height}px`
        } else {
            this._wrapperEl.style.left = `${transformedPosition.x}px`
            this._wrapperEl.style.top = `${transformedPosition.y}px`
        }
    }

    private onCanvasTransform() {
        this.setPosition()
    }

    private initalizeListeners() {
        this._quill.on('text-change', this.onTextChange)
        this.engine.canvas.transform.add(this.onCanvasTransform, this)
    }

    private removeListeners() {
        this._quill.off('text-change', this.onTextChange)
        this.engine.canvas.transform.remove(this.onCanvasTransform, this)
    }

    private onTextChange() {
        this.textChanged.dispatch({
            text: this._quill.getText(),
            textOps: this.convertDeltaToAttributeMap(this._quill.getContents()),
        })
    }

    private onEscape() {
        // on escape, blur the focus
        this._quill.blur()
        this.editorBlurred.dispatch()
    }

    private addStyle(el: HTMLElement, prop: string, value: string) {
        this._initialStylesHTML.push([
            el,
            prop,
            el.style.getPropertyValue(prop),
        ])

        el.style.setProperty(prop, value)
    }

    private addStyles() {
        this._wrapperEl.style.display = 'block'
        this._editorContainer.style.fontSize = `${this._editProps.fontSize}px`
        this._quill.root.style.lineHeight = `${this._editProps.lineHeight * this._editProps.fontSize}px`
        this._quill.root.style.textAlign = `${this._editProps.textAlign}`
        this._editorContainer.style.width = `${this._editProps.width}px`

        if (this._editProps.for === 'shapeText') {
            this.addStyle(this._editorContainer, 'overflow', 'hidden')
            this.addStyle(this._editorContainer, 'width', 'hidden')
            this.addStyle(
                this._editorContainer,
                'line-height',
                `${this._editProps.height}px`,
            )
            this.addStyle(this._quill.root, 'display', 'inline-block')
            this.addStyle(
                this._quill.root,
                'width',
                `${this._editProps.width}px`,
            )
            this.addStyle(this._quill.root, 'vertical-align', 'middle')
            this.addStyle(this._quill.root, 'overflow', 'hidden')
            this.addStyle(this._quill.root, 'overflow-wrap', 'break-word')
            this.addStyle(this._quill.root, 'white-space', 'pre-wrap')
            this.addStyle(
                this._quill.root,
                'line-height',
                `${this._editProps.lineHeight * this._editProps.fontSize}px`,
            )
            this.addStyle(this._quill.root, 'height', 'auto')
        }

        if (!this._editProps.showPlaceholder) {
            this._quill.root.classList.add('disable-placeholder')
        }
    }

    private clearPrevStyles() {
        this._initialStylesHTML.forEach((item) =>
            item[0].style.setProperty(item[1], item[2]),
        )
        this._initialStylesHTML = []
    }

    updateSize(props: Pick<EditProps, 'width' | 'height' | 'x' | 'y'>) {
        if (this._editProps.for === 'shapeText') return
        this._editProps.x = props.x
        this._editProps.y = props.y
        this._editProps.width = props.width
        this._editProps.height = props.height
        this.setPosition()
    }

    showEditor(props: EditProps) {
        this._editProps = props
        this._editProps.showPlaceholder = !!props.showPlaceholder

        this.addStyles()

        this.setPosition()
        this._quill.setText(props.initialText || '')

        this._quill.focus()
        this._isShowing = true

        this.initalizeListeners()
    }

    hideEditor() {
        // first remove listeners so that TextService can not
        // listen to events occurring during cleaning
        this.removeListeners()
        this._wrapperEl.style.display = 'none'
        this._isShowing = false
        this.clearPrevStyles()
    }

    convertDeltaToAttributeMap(delta: Delta): TextOp[] {
        return delta.ops.map((op) => ({
            text: typeof op.insert === 'string' ? op.insert : '',
            attributes:
                typeof op.insert === 'string' ? op.attributes || {} : {},
        }))
    }

    getSelection(): QRange | null {
        if (!this._isShowing) return null
        return this._quill.getSelection()
    }

    // formats current selection
    format(name: string, value: unknown) {
        return this._quill.format(name, value)
    }

    get isActive(): boolean {
        return this._isShowing
    }
}

export const createTextOpsFromString = (text: string): TextOp[] => {
    return [
        {
            text,
            attributes: {},
        },
    ]
}
