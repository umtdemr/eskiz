/**
 * Test double for `@/core/textEditor/TextEditor`.
 *
 * The real module imports Quill, which touches `document` at import time and
 * therefore cannot be loaded in the node test environment. Shape/widget tests
 * only need `createTextOpsFromString` (and the `TextOp` type, which is erased
 * at runtime), so we mirror that single function here.
 *
 * Usage:
 *   vi.mock('@/core/textEditor/TextEditor', () => import('@/test/mockTextEditor'))
 */
import type { TextOp } from '@/core/textEditor/TextEditor'

export const createTextOpsFromString = (text: string): TextOp[] => {
    return [
        {
            text,
            attributes: {},
        },
    ]
}
