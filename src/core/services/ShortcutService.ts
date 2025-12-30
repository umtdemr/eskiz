import { Service } from './Service'
import { Engine } from '../engine/Engine'

export class ShortcutService extends Service {
    constructor(engine: Engine) {
        super(engine)
        window.addEventListener('keydown', this.onKeyDown)
    }

    private onKeyDown = (e: KeyboardEvent) => {
        // Undo/Redo
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    this.engine.historyManager.redo()
                } else {
                    this.engine.historyManager.undo()
                }
                e.preventDefault()
                return
            }
            if (e.key.toLowerCase() === 'y') {
                this.engine.historyManager.redo()
                e.preventDefault()
                return
            }
        }
    }

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown)
    }
}
