import { ACTION_MODES, SUB_ACTION_MODES } from '@/helpers/Constant'
import { ToolService } from '../services/ToolService'
import { Command, CommandCtx, Shortcut } from './Command'

type Params = {
    tool: keyof typeof ACTION_MODES
    subTool?: keyof typeof SUB_ACTION_MODES
}

export class ChangeTool extends Command<Params> {
    readonly name = 'changeTool'
    readonly shortcuts: Shortcut<Params>[] = [
        { key: 'v', params: { tool: 'SELECT' } },
        { key: 'h', params: { tool: 'PAN' } },
        { key: 't', params: { tool: 'TEXT' } },
        { key: 'r', params: { tool: 'CREATE', subTool: 'CREATE_RECTANGLE' } },
        { key: 'o', params: { tool: 'CREATE', subTool: 'CREATE_ELLIPSE' } },
        { key: 'l', params: { tool: 'LINE' } },
        { key: 'p', params: { tool: 'PATH', subTool: 'DRAW_PEN' } },
        { key: 'e', params: { tool: 'PATH', subTool: 'ERASER' } },
        { key: 's', params: { tool: 'STICKY_NOTE' } },
    ]

    canExecute(_ctx: CommandCtx<Params>): boolean {
        return true
    }

    execute(ctx: CommandCtx<Params>) {
        const { tool, subTool } = ctx.params
        ctx.engine
            .getService<ToolService>('toolService')
            .changeTool(tool, subTool)
    }
}
