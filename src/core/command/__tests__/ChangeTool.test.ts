import { describe, it, expect, vi } from 'vitest'
import { ChangeTool } from '../ChangeTool'
import { createCommandCtx, createEngineMock } from '@/test/commandUtils'

describe('ChangeTool', () => {
    it('changes the tool and the sub tool', () => {
        const toolService = { changeTool: vi.fn() }
        const engine = createEngineMock({ toolService })

        new ChangeTool().execute(
            createCommandCtx(engine, {
                params: { tool: 'PATH', subTool: 'ERASER' },
            }),
        )

        expect(toolService.changeTool).toHaveBeenCalledWith('PATH', 'ERASER')
    })
})
