/**
 * Shared module mocks for every test file (registered via `test.setupFiles`).
 *
 * - The real canvas module can only be initialized in the browser; the mock
 *   boots the same Skia wasm binary for node so rendering tests use real Skia.
 * - Quill (imported by TextEditor) needs a DOM; shapes only need
 *   createTextOpsFromString, which the mock mirrors.
 *
 * The factories are lazy, so test files that never import these modules
 * (signal, emitter, geometry, ...) don't pay the wasm/font boot.
 */
import { vi } from 'vitest'

vi.mock('@/core/canvas/Canvas', () => import('@/test/mockCanvasKit'))
vi.mock('@/core/textEditor/TextEditor', () => import('@/test/mockTextEditor'))
