import { Signal } from '../signal/Signal'
import { BoardGridType } from '../constants'

export type GridType = (typeof BoardGridType)[keyof typeof BoardGridType]

export type SettingsValues = {
    gridType: GridType
    isGridSnapEnabled: boolean
}

export const defaultSettings: SettingsValues = {
    gridType: BoardGridType.LINES,
    isGridSnapEnabled: false,
}

export class Settings {
    private values: SettingsValues = { ...defaultSettings }

    // all the values, after any of them changes
    changed = new Signal<SettingsValues>()

    get gridType() {
        return this.values.gridType
    }

    get isGridSnapEnabled() {
        return this.values.isGridSnapEnabled
    }

    /** changes the given values, leaves the rest */
    set(values: Partial<SettingsValues>) {
        const next = { ...this.values, ...values }
        const same = (Object.keys(next) as (keyof SettingsValues)[]).every(
            (key) => next[key] === this.values[key],
        )
        if (same) return

        this.values = next
        this.changed.dispatch({ ...next })
    }

    dispose() {
        this.changed.removeAll()
    }
}
