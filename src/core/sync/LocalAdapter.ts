import { openDB, IDBPDatabase } from 'idb'
import { ISyncAdapter } from '@/core/sync/ISyncAdapter.ts'
import {
    AddWidgetPayload,
    AddWidgetResponse,
    FetchPageDetailsResponse,
    UpdateWidgetPayload,
    WsWidget,
} from '@/types/Websocket.ts'

const DB_NAME = 'whiteboardDB'
const DB_VERSION = 1
const WIDGETS_STORE = 'widgets'

/**
 * LocalAdapter implements ISyncAdapter using IndexedDB for standalone mode.
 */
export class LocalAdapter implements ISyncAdapter {
    private dbPromise: Promise<IDBPDatabase>

    constructor() {
        this.dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(WIDGETS_STORE)) {
                    const store = db.createObjectStore(WIDGETS_STORE, {
                        keyPath: 'uuid',
                    })
                    store.createIndex('pageId', 'page_id')
                }
            },
        })
    }

    async syncTransaction(data: UpdateWidgetPayload): Promise<void> {
        const db = await this.dbPromise
        const tx = db.transaction(WIDGETS_STORE, 'readwrite')
        const store = tx.objectStore(WIDGETS_STORE)

        for (const shape of data.shapes) {
            const existing = await store.get(shape.uuid)
            if (existing) {
                // merge partial update into existing widget
                const updated = { ...existing }
                if (shape.data) {
                    // merge top-level fields from data
                    for (const [key, value] of Object.entries(shape.data)) {
                        if (
                            key === 'properties' &&
                            typeof value === 'object' &&
                            value !== null
                        ) {
                            updated.properties = {
                                ...updated.properties,
                                ...(value as Record<string, unknown>),
                            }
                        } else {
                            updated[key] = value
                        }
                    }
                }
                if (shape.is_deleted !== undefined) {
                    updated.is_deleted = shape.is_deleted
                }
                updated.is_committed = data.is_committed
                await store.put(updated)
            }
        }

        await tx.done
    }

    async fetchPageDetails(pageId: number): Promise<FetchPageDetailsResponse> {
        const db = await this.dbPromise
        const tx = db.transaction(WIDGETS_STORE, 'readonly')
        const index = tx.objectStore(WIDGETS_STORE).index('pageId')
        const widgets = (await index.getAll(pageId)) as WsWidget[]
        await tx.done
        return { widgets }
    }

    async addWidget(data: AddWidgetPayload): Promise<AddWidgetResponse> {
        const db = await this.dbPromise

        const widget: WsWidget = {
            uuid: data.uuid!,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            z_index: data.z_index,
            widget_type: data.widget_type,
            sub_type: data.sub_type,
            properties: data.properties ?? {},
            is_deleted: false,
            is_locked: false,
            angle: data.angle ?? 0,
            parent_widget_id: data.parent_widget_id, // todo: do we need this?
        }

        // store page_id alongside the widget for indexing
        const record = { ...widget, page_id: data.page_id }

        await db.put(WIDGETS_STORE, record)

        return { widget }
    }

    async changeBoardName(): Promise<undefined> {
        // board name changes are not supported in standalone mode
        return undefined
    }
}
