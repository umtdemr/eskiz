import { useRef } from 'react'
import { Editor } from './Editor'

import Quill from 'quill'
const Delta = Quill.import('delta')

export function EditorContainer() {
    const quillRef = useRef<Quill>(null)

    return (
        <div className="editor-container" style={{ position: 'fixed' }}>
            <Editor
                ref={quillRef}
                defaultValue={new Delta().insert('')}
                readOnly={true}
                onSelectionChange={() => {
                    console.log('selection changed')
                }}
                onTextChange={() => console.log('text changed')}
            />
        </div>
    )
}
