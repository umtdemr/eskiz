import { Point } from '../canvas/Canvas'
import { DuplicationService } from '../services/DuplicationService'
import { WidgetJson } from '../shapes/Widget'
import { Command, CommandCtx } from './Command'

type Params = {
    widgets: WidgetJson[]
    // center of the pasted widgets
    at: Point
}

export class PasteCommand extends Command<Params> {
    readonly name = 'paste'

    canExecute(ctx: CommandCtx<Params>): boolean {
        return ctx.params.widgets.length > 0
    }

    execute(ctx: CommandCtx<Params>) {
        if (!this.canExecute(ctx)) return

        const { widgets, at } = ctx.params

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity
        widgets.forEach((json) => {
            minX = Math.min(minX, json.x)
            minY = Math.min(minY, json.y)
            maxX = Math.max(maxX, json.x + json.width)
            maxY = Math.max(maxY, json.y + json.height)
        })

        const duplicationService =
            ctx.engine.getService<DuplicationService>('duplication')
        const added = duplicationService.addCopies(
            widgets,
            at.x - (minX + maxX) / 2,
            at.y - (minY + maxY) / 2,
        )

        ctx.selectionService.selectWidgets(added)
        ctx.engine.canvas.requestRender()
    }
}
