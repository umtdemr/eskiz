import { Widget } from '@/core/shapes/Widget'
import { EditingMethods, State } from '@/core/transaction/State'

export interface HistoryEntry {
    undo(): void
    redo(): void
}

export interface TransactionData {
    initialState: Map<Widget, State>
    finalState: Map<Widget, State>
    editTable: Map<Widget, EditingMethods[]>
}
