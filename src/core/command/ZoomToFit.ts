import { Command, CommandCtx, Shortcut } from './Command'

export class ZoomToFit extends Command {
    readonly name = 'zoomToFit'
    // code, since shift turns 1 into ! on most layouts
    readonly shortcuts: Shortcut[] = [{ key: 'Digit1', shift: true }]

    canExecute(ctx: CommandCtx): boolean {
        return !!ctx.engine.stage.contentBounds()
    }

    execute(ctx: CommandCtx) {
        ctx.engine.camera.fitContent({ animate: true })
    }
}
