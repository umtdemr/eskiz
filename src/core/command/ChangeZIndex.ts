import { Widget } from '../shapes/Widget'
import { Command, CommandCtx, Commands } from './Command'
import { EditingMethods } from '../transaction/State'

export type ZIndexAction =
    | 'bringToFront'
    | 'bringForward'
    | 'sendBackward'
    | 'sendToBack'

export class ChangeZIndex extends Command {
    constructor(name: Commands) {
        super(name)
    }

    canExecute(ctx: CommandCtx): boolean {
        return ctx.selectionService.selected.length > 0
    }

    execute(ctx: CommandCtx): void {
        if (!this.canExecute(ctx)) return

        const { selectionService, engine, params } = ctx
        const action = params?.action as ZIndexAction
        const widgets = selectionService.selected

        if (!action) return

        const affectedWidgets: Widget[] = []
        const parentLayer = engine.stage.widgetsDefaultLayer
        const indexer = engine.stage.indexer

        // sort widgets by their current position in the layer to maintain relative order
        // with this way, we ensure that widgets in the selection keep their relative order after z-index change
        const sortedWidgets = [...widgets].sort((a, b) => {
            return a.zIndex < b.zIndex ? -1 : 1
        })

        // "to front" and "backward" go bottom-up, "to back" and "forward" top-down,
        // otherwise neighbours in the selection swap back and cancel out
        const processOrder =
            action === 'bringToFront' || action === 'sendBackward'
                ? sortedWidgets
                : sortedWidgets.reverse()

        const initialZIndexes = new Map<string, string>()
        processOrder.forEach((w) => initialZIndexes.set(w.uuid!, w.zIndex))

        for (const widget of processOrder) {
            let moved = false

            switch (action) {
                case 'bringToFront':
                    moved = parentLayer.bringChildToFront(widget)
                    if (moved) {
                        // Update zIndex to reflect new position
                        widget.zIndex = indexer.generateBringToFrontIndex(
                            widget,
                            parentLayer,
                        )
                    }
                    break
                case 'bringForward':
                    moved = parentLayer.bringChildForward(widget)
                    if (moved) {
                        widget.zIndex = indexer.generateBringForwardIndex(
                            widget,
                            parentLayer,
                        )
                    }
                    break
                case 'sendBackward':
                    moved = parentLayer.sendChildBackward(widget)
                    if (moved) {
                        widget.zIndex = indexer.generateSendBackwardIndex(
                            widget,
                            parentLayer,
                        )
                    }
                    break
                case 'sendToBack':
                    moved = parentLayer.sendChildToBack(widget)
                    if (moved) {
                        widget.zIndex = indexer.generateSendToBackIndex(
                            widget,
                            parentLayer,
                        )
                    }
                    break
                default:
                    continue
            }

            if (moved) {
                affectedWidgets.push(widget)
            }
        }

        if (affectedWidgets.length > 0) {
            engine.canvas.requestRender()

            const editTable = new Map<Widget, EditingMethods[]>()
            const { transactionId } = engine.transactionHandler.begin(
                'immediate',
                { editTable },
            )

            affectedWidgets.forEach((widget) => {
                engine.transactionHandler.addEditingMethod(
                    transactionId,
                    widget,
                    'zIndex',
                    { z_index: initialZIndexes.get(widget.uuid!) },
                )
            })

            engine.transactionHandler.commit(transactionId)
        }
    }
}
