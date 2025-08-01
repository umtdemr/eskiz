import {
    useRef,
    forwardRef,
    useLayoutEffect,
    useEffect,
    useImperativeHandle,
} from 'react'
import Quill, { Delta } from 'quill'

export interface EditorProps {
    readOnly: boolean
    defaultValue: Delta | null
    onTextChange: () => void
    onSelectionChange: () => void
}

export const Editor = forwardRef<Quill, EditorProps>(
    ({ readOnly, defaultValue, onTextChange, onSelectionChange }, ref) => {
        const internalRef = useRef<Quill | null>(null)
        const containerRef = useRef<HTMLDivElement>(null)
        const defaultValueRef = useRef(defaultValue)
        const onTextChangeRef = useRef(onTextChange)
        const onSelectionChangeRef = useRef(onSelectionChange)

        useImperativeHandle(ref, () => internalRef.current!, [])

        useLayoutEffect(() => {
            onTextChangeRef.current = onTextChange
            onSelectionChangeRef.current = onSelectionChange
        })

        useEffect(() => {
            internalRef.current?.enable(!readOnly)
        }, [internalRef, readOnly])

        useEffect(() => {
            const container = containerRef.current
            if (!container) {
                return
            }
            const editorContainer = container.appendChild(
                container.ownerDocument.createElement('div'),
            )
            const quill = new Quill(editorContainer, {})

            internalRef.current = quill

            if (defaultValueRef.current) {
                quill.setContents(defaultValueRef.current)
            }

            quill.on(Quill.events.TEXT_CHANGE, (...args) => {
                onTextChangeRef.current?.(...args)
            })

            quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
                onSelectionChangeRef.current?.(...args)
            })

            return () => {
                internalRef.current = null
                container.innerHTML = ''
            }
        }, [internalRef])

        return <div ref={containerRef}></div>
    },
)
