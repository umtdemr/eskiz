import { Engine } from '../engine/Engine'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Commands } from './Command'

interface OpenEdit {
    name: Commands
    widgets: Widget[]
    transactionId: string
    timeoutId?: ReturnType<typeof setTimeout>
}

// keeps continuous transactions (slider, color picker drags) open between
// calls. edits are keyed by command and target widgets, so commands can stay
// stateless and edits on different widgets don't mix
export class ContinuousEdits {
    private engine: Engine
    private edits = new Set<OpenEdit>()

    constructor(engine: Engine) {
        this.engine = engine
    }

    apply(
        name: Commands,
        editTable: Map<Widget, EditingMethods[]>,
        change: () => boolean,
    ) {
        const widgets = [...editTable.keys()]
        let edit = this.find(name, widgets)

        if (!edit) {
            // two edits must not record the same widget
            this.end(name, widgets)

            const { transactionId } = this.engine.transactionHandler.begin(
                'continuous',
                {
                    editTable,
                },
            )
            edit = { name, widgets, transactionId }
            this.edits.add(edit)
        }

        if (change()) {
            this.engine.canvas.requestRender()
        }

        clearTimeout(edit.timeoutId)
        // TODO: phase 2 - check error
        this.engine.transactionHandler.update(edit.transactionId)

        const current = edit
        current.timeoutId = setTimeout(
            () => this.commit(current),
            CONTINUOUS_THROTTLE_DELAY,
        )
    }

    // commits open edits of the command that touch any of the widgets
    end(name: Commands, widgets: Widget[]) {
        for (const edit of [...this.edits]) {
            if (
                edit.name === name &&
                edit.widgets.some((w) => widgets.includes(w))
            ) {
                this.commit(edit)
            }
        }
    }

    private find(name: Commands, widgets: Widget[]) {
        for (const edit of this.edits) {
            if (
                edit.name === name &&
                edit.widgets.length === widgets.length &&
                edit.widgets.every((w) => widgets.includes(w))
            ) {
                return edit
            }
        }
    }

    private commit(edit: OpenEdit) {
        if (!this.edits.delete(edit)) return

        clearTimeout(edit.timeoutId)
        this.engine.transactionHandler.commit(edit.transactionId)
    }
}
