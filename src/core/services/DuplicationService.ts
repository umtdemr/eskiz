import { Service } from './Service'
import { Widget } from '../shapes/Widget'
import { nanoid } from 'nanoid'
import { PageService } from './PageService'
import { WidgetsService } from './WidgetsService'
import { CreationHistoryEntry } from '../history/HistoryManager'
import { WidgetType } from '../constants'

export class DuplicationService extends Service {
    duplicateWidgets(widgets: Widget[]): Widget[] {
        if (!widgets.length) return []

        const pageService = this.engine.getService<PageService>('page')
        const widgetsService = this.engine.getService<WidgetsService>('widgets')

        const oldToNewIdMap = new Map<string, string>()

        // generate new JSONs and collect ID mappings
        const clonedJsons = widgets.map((widget) => {
            const json = widget.toJson()
            const newId = nanoid()
            if (json.uuid) {
                oldToNewIdMap.set(json.uuid, newId)
            }

            // offset position
            json.x += 20
            json.y += 20

            // assign new z_index and id
            json.z_index = this.engine.stage.indexer.generateIndexForWidget(
                this.engine.stage.widgetsDefaultLayer,
                null,
            )
            json.uuid = newId

            return json
        })

        // update line bindings
        for (const json of clonedJsons) {
            if (json.widget_type === WidgetType.LINE && json.properties) {
                const headBinding = json.properties.headBinding as
                    | { id: string }
                    | undefined
                const tailBinding = json.properties.tailBinding as
                    | { id: string }
                    | undefined

                if (headBinding) {
                    if (oldToNewIdMap.has(headBinding.id)) {
                        // target is also duplicated
                        headBinding.id = oldToNewIdMap.get(headBinding.id)!
                    } else {
                        // target is not duplicated, detach line from it
                        delete json.properties.headBinding
                    }
                }

                if (tailBinding) {
                    if (oldToNewIdMap.has(tailBinding.id)) {
                        // target is also duplicated
                        tailBinding.id = oldToNewIdMap.get(tailBinding.id)!
                    } else {
                        // target is not duplicated, detach line from it
                        delete json.properties.tailBinding
                    }
                }
            }
        }

        // add to canvas
        const addedWidgets = pageService.addWidgetsToCanvas(clonedJsons)

        // add to db
        for (const json of clonedJsons) {
            // TODO: phase 2 - check error
            // TODO: bulk add
            widgetsService.addWidget({ ...json, page_id: this.engine.pageId })
        }

        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, addedWidgets),
        )

        return addedWidgets
    }
}
