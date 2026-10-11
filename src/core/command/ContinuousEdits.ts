import { Engine } from '../engine/Engine'
import { Widget } from '../shapes/Widget'
import { EditingMethods } from '../transaction/State'
import { CONTINUOUS_THROTTLE_DELAY } from '../transaction/TransactionHandler'
import { Commands } from './Command'

interface OpenEdit {
    name: Commands
    widgets: Widget[]
    transactionId: string
    changed: boolean
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
        // open edits on these widgets go into the history before the new one
        engine.transactionHandler.beginning.add(({ widgets }) =>
            this.flush(widgets),
        )
    }

    apply(
        name: Commands,
        editTable: Map<Widget, EditingMethods[]>,
        change: () => boolean,
    ) {
        const widgets = [...editTable.keys()]
        let edit = this.find(name, widgets)

        if (!edit) {
            // begin commits other open edits on these widgets
            const { transactionId } = this.engine.transactionHandler.begin(
                'continuous',
                {
                    editTable,
                },
            )
            edit = { name, widgets, transactionId, changed: false }
            this.edits.add(edit)
        }

        if (change()) {
            edit.changed = true
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

    // commits open edits right away, only the ones touching `widgets` if given
    flush(widgets?: Widget[]) {
        for (const edit of [...this.edits]) {
            if (!widgets || edit.widgets.some((w) => widgets.includes(w))) {
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
        // unchanged values stay out of the history
        this.engine.transactionHandler.commit(edit.transactionId, edit.changed)
    }
}
