import { Service } from './Service'
import { Engine } from '../engine/Engine'
import { MouseController } from '../engine/MouseController'

// the key belongs to a field, an open dialog or a menu, not the board
export const isOutsideBoard = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el?.tagName) return false
    if (el.isContentEditable) return true
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true

    return !!el.closest('[role="dialog"], [role="alertdialog"], [role="menu"]')
}

// runs the commands bound to the pressed keys. the bindings live on the
// commands themselves (see Command.shortcuts)
export class ShortcutService extends Service {
    private mouseController: MouseController

    constructor(engine: Engine, mouseController: MouseController) {
        super(engine)
        this.mouseController = mouseController
        window.addEventListener('keydown', this.onKeyDown)
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (!this.enabled || e.defaultPrevented || e.isComposing) return
        if (isOutsideBoard(e.target) || this.engine.textEditor.isActive) return
        // don't change things under a running drag or drawing
        if (this.mouseController.isMouseDown) return

        if (this.engine.executeShortcut(e)) {
            e.preventDefault()
        }
    }

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown)
    }
}
