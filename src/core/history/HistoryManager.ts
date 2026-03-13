import { Engine } from '@/core/engine/Engine'
import { HistoryEntry, TransactionData } from './HistoryEntry'
import { Widget } from '@/core/shapes/Widget'
import { WsWidget } from '@/types/Websocket'
import { EditingMethods, State } from '@/core/transaction/State'
import { SelectionService } from '../services/SelectionService'
import { Signal } from '../signal/Signal'
import { Line } from '@/core/shapes/line/Line'

export class HistoryManager {
    private undoStack: HistoryEntry[] = []
    private redoStack: HistoryEntry[] = []
    private engine: Engine

    public historyChanged = new Signal<{ canUndo: boolean; canRedo: boolean }>()

    constructor(engine: Engine) {
        this.engine = engine
    }

    get canUndo() {
        return this.undoStack.length > 0
    }

    get canRedo() {
        return this.redoStack.length > 0
    }

    push(entry: HistoryEntry) {
        this.undoStack.push(entry)
        this.redoStack = [] // clear redo stack on new action
        this.emitHistoryChanged()
    }

    undo() {
        const entry = this.undoStack.pop()
        if (entry) {
            entry.undo()
            this.redoStack.push(entry)
            this.engine.canvas.requestRender()
            this.emitHistoryChanged()
        }
    }

    redo() {
        const entry = this.redoStack.pop()
        if (entry) {
            entry.redo()
            this.undoStack.push(entry)
            this.engine.canvas.requestRender()
            this.emitHistoryChanged()
        }
    }

    private emitHistoryChanged() {
        this.historyChanged.dispatch({
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0,
        })
    }
}

export class TransactionHistoryEntry implements HistoryEntry {
    constructor(
        private engine: Engine,
        private data: TransactionData,
    ) {}

    undo() {
        this.applyState(this.data.initialState)
    }

    redo() {
        this.applyState(this.data.finalState)
    }

    private applyState(stateMap: Map<Widget, State>) {
        const editTable = new Map<Widget, EditingMethods[]>()

        for (const [widget, state] of stateMap.entries()) {
            widget.updateWithPartialState(state as Partial<WsWidget>)

            if (widget instanceof Line) {
                const props = state.properties as
                    | Record<string, unknown>
                    | undefined
                if (
                    props &&
                    (props.headBinding !== undefined ||
                        props.tailBinding !== undefined)
                ) {
                    widget.resolveBindings(
                        this.engine.stage.widgetsDefaultLayer,
                    )

                    if (props.headBinding !== undefined) {
                        widget.updatePointFromBinding('head')
                    }

                    if (props.tailBinding !== undefined) {
                        widget.updatePointFromBinding('tail')
                    }
                }
            }

            if (state.is_deleted === true) {
                // add to editTable for broadcasting deletion
                const originalMethods = this.data.editTable.get(widget) || [
                    'delete',
                ]
                editTable.set(widget, originalMethods)
            } else if (state.is_deleted === false) {
                // just a property update (or redundant restore)
                const originalMethods = this.data.editTable.get(widget) || [
                    'delete',
                ]
                editTable.set(widget, originalMethods)
            } else {
                // normal update
                const originalMethods = this.data.editTable.get(widget) || []
                editTable.set(widget, originalMethods)
            }
        }

        // broadcast updates/deletions
        if (editTable.size > 0) {
            const { transactionId } = this.engine.transactionHandler.begin(
                'immediate',
                { editTable },
            )
            this.engine.transactionHandler.commit(transactionId, false) // false = don't push to history
        }
    }
}

export class CreationHistoryEntry implements HistoryEntry {
    private widgets: Widget[]

    constructor(
        private engine: Engine,
        widgets: Widget | Widget[],
    ) {
        this.widgets = Array.isArray(widgets) ? widgets : [widgets]
    }

    undo() {
        // remove widgets
        const editTable = new Map<Widget, EditingMethods[]>()

        this.widgets.forEach((widget) => {
            widget.delete()
            widget.isDeleted = true
            // this.engine.stage.widgetsDefaultLayer.removeChild(widget)
            editTable.set(widget, ['delete'])
        })

        const selectionService =
            this.engine.getService<SelectionService>('selection')
        if (selectionService) {
            selectionService.clearSelection()
        }

        const { transactionId } = this.engine.transactionHandler.begin(
            'immediate',
            { editTable },
        )
        this.engine.transactionHandler.commit(transactionId, false)

        this.engine.canvas.requestRender()
    }

    redo() {
        // add widgets back
        const editTable = new Map<Widget, EditingMethods[]>()

        this.widgets.forEach((widget) => {
            widget.isDeleted = false
            editTable.set(widget, ['delete'])
        })

        // Broadcast restoration
        const { transactionId } = this.engine.transactionHandler.begin(
            'immediate',
            { editTable },
        )
        this.engine.transactionHandler.commit(transactionId, false)

        this.engine.canvas.requestRender()
    }
}
