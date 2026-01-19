import { nanoid } from 'nanoid'
import { Widget } from '@/core/shapes/Widget'
import { WsEngine } from '@/core/WsEngine'
import { Engine } from '@/core/engine/Engine'
import { TransactionHistoryEntry } from '@/core/history/HistoryManager'
import {
    EditingMethods,
    getPartialState,
    State,
} from '@/core/transaction/State'

export type TransactionType = 'immediate' | 'continuous'
export type TransactionId = string
export type EditTable = Map<Widget, EditingMethods[]>

export interface Transaction {
    type: TransactionType
    editTable: EditTable
    initialState: Map<Widget, State>
    lastUpdate: number
    isCommitted: boolean
    id: TransactionId
}

type StarTransactionProps = {
    editTable: EditTable
}

export const CONTINUOUS_THROTTLE_DELAY = 300 // 300 MS

/*
 * TransactionHandler handles updating/deleting widgets
 */
export class TransactionHandler {
    private engine: Engine
    private transactions = new Map<TransactionId, Transaction>()
    private autoUpdateTimeout = new Map<
        TransactionId,
        ReturnType<typeof setTimeout>
    >()

    constructor(engine: Engine) {
        this.engine = engine
    }

    private clear(id: TransactionId) {
        this.transactions.delete(id)
        this.autoUpdateTimeout.delete(id)
    }

    /**
     * Starts a transaction
     */
    begin(type: TransactionType, props: StarTransactionProps) {
        const initialState = new Map<Widget, State>()
        for (const widget of props.editTable.keys()) {
            const editingMethods = props.editTable.get(widget)!
            initialState.set(widget, getPartialState(widget, editingMethods))
        }

        const transactionId = nanoid()

        this.transactions.set(transactionId, {
            type,
            editTable: props.editTable,
            initialState,
            id: transactionId,
            lastUpdate: 0,
            isCommitted: false,
        })

        return { transactionId }
    }

    /**
     * Sends updates for the given continuous transaction
     * @param id - Continuous transaction id
     */
    update(id: TransactionId) {
        const transaction = this.transactions.get(id)
        if (!transaction) {
            return
        }

        if (transaction.type === 'immediate') {
            return
        }

        // check if there is any auto update
        // since we received a new update event, we can ignore the auto update request
        if (this.autoUpdateTimeout.has(id)) {
            const timeoutId = this.autoUpdateTimeout.get(id)
            clearTimeout(timeoutId)
            this.autoUpdateTimeout.delete(id)
        }

        const now = new Date().getTime()
        const diffTime = now - transaction.lastUpdate

        if (!(diffTime >= CONTINUOUS_THROTTLE_DELAY)) {
            const timeout = setTimeout(
                () => {
                    this.update(id)
                },
                Math.min(diffTime, CONTINUOUS_THROTTLE_DELAY),
            )

            this.autoUpdateTimeout.set(id, timeout)

            return
        }

        transaction.lastUpdate = now
        this.sendChanges(transaction)
    }

    /**
     * update existing transaction edit methods
     */
    addEditingMethod(
        id: TransactionId,
        widget: Widget,
        method: EditingMethods,
        initialData?: State,
    ) {
        const transaction = this.transactions.get(id)
        if (!transaction) {
            return
        }

        const editTable = transaction.editTable
        const existingMethods = editTable.get(widget) || []

        if (!existingMethods.includes(method)) {
            existingMethods.push(method)
            editTable.set(widget, existingMethods)

            const stateToMerge =
                initialData || getPartialState(widget, [method])

            // update initial state
            if (!transaction.initialState.has(widget)) {
                transaction.initialState.set(widget, stateToMerge)
            } else {
                const state = transaction.initialState.get(widget)!
                // if both have properties, merge them
                if (
                    state.properties &&
                    typeof state.properties === 'object' &&
                    !Array.isArray(state.properties) &&
                    stateToMerge.properties &&
                    typeof stateToMerge.properties === 'object' &&
                    !Array.isArray(stateToMerge.properties)
                ) {
                    const properties = state.properties
                    const mergeProperties = stateToMerge.properties
                    Object.assign(properties, mergeProperties)
                    delete stateToMerge.properties
                }

                Object.assign(state, stateToMerge)
            }
        }
    }

    private sendChanges(transaction: Transaction) {
        const widgetStates: State[] = []
        for (const [widget, editMethods] of transaction.editTable.entries()) {
            widgetStates.push({
                uuid: widget.uuid,
                data: getPartialState(widget, editMethods),
            })
        }
        const sendingData = {
            transaction_id: transaction.id,
            is_committed: transaction.isCommitted,
            shapes: widgetStates,
        }

        this.engine.wsEngine.sendAsyncMessage<'updateWidget'>({
            type: 'updateWidget',
            data: sendingData,
        })

        console.log(sendingData)
    }

    /**
     * sends last update for the transaction
     */
    commit(id: TransactionId, addToHistory: boolean = true) {
        const transaction = this.transactions.get(id)
        if (!transaction) {
            console.error(`no transaction found for: ${id}`)
            return
        }

        // if there is a pending auto update, avoid it
        this.autoUpdateTimeout.delete(id)

        // mark as committed
        transaction.isCommitted = true

        // send latest changes
        this.sendChanges(transaction)

        if (addToHistory) {
            // capture final state for history
            const finalState = new Map<Widget, State>()
            for (const widget of transaction.editTable.keys()) {
                const editingMethods = transaction.editTable.get(widget)!
                finalState.set(widget, getPartialState(widget, editingMethods))
            }

            this.engine.historyManager.push(
                new TransactionHistoryEntry(this.engine, {
                    initialState: transaction.initialState,
                    finalState,
                    editTable: transaction.editTable,
                }),
            )
        }

        // clear state for the transaction
        this.clear(id)
    }
}
