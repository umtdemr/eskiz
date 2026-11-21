import { Widget } from '../shapes/Widget'
import { Command, CommandCtx, Shortcut } from './Command'
import { EditingMethods } from '../transaction/State'

export type ZIndexAction =
    | 'bringToFront'
    | 'bringForward'
    | 'sendBackward'
    | 'sendToBack'

type Params = { action: ZIndexAction }

export class ChangeZIndex extends Command<Params> {
    readonly name = 'changeZIndex'
    // codes, since brackets need altgr on some layouts
    readonly shortcuts: Shortcut<Params>[] = [
        { key: 'BracketRight', mod: true, params: { action: 'bringForward' } },
        {
            key: 'BracketRight',
            mod: true,
            shift: true,
            params: { action: 'bringToFront' },
        },
        { key: 'BracketLeft', mod: true, params: { action: 'sendBackward' } },
        {
            key: 'BracketLeft',
            mod: true,
            shift: true,
            params: { action: 'sendToBack' },
        },
    ]

    canExecute(ctx: CommandCtx<Params>): boolean {
        return ctx.widgets.length > 0
    }

    execute(ctx: CommandCtx<Params>): void {
        if (!this.canExecute(ctx)) return

        const { engine, params, widgets } = ctx
        const { action } = params

        const parentLayer = engine.stage.widgetsDefaultLayer
        const keys = engine.stage.indexer.reorder(parentLayer, widgets, action)

        const affectedWidgets: Widget[] = []
        const initialZIndexes = new Map<Widget, string>()
        for (const widget of widgets) {
            const key = keys.get(widget)
            if (!key) continue

            initialZIndexes.set(widget, widget.zIndex)
            widget.zIndex = key
            parentLayer.repositionChild(widget)
            affectedWidgets.push(widget)
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
                    { z_index: initialZIndexes.get(widget) },
                )
            })

            engine.transactionHandler.commit(transactionId)
        }
    }
}
