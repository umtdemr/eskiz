/**
 * Test double for `@/core/canvas/Canvas`.
 *
 * The real module can only be initialized in the browser (it fetches the wasm
 * binary over http and loads fonts with `fetch`). For tests we load the very
 * same CanvasKit wasm binary directly from node_modules and the same font from
 * `public/fonts`, so the shapes render through the exact Skia code paths used
 * in production.
 *
 * Usage (must be the real module path so every transitive import gets it):
 *
 *   vi.mock('@/core/canvas/Canvas', () => import('@/test/mockCanvasKit'))
 */
import CanvasKitInit, { CanvasKit, FontMgr } from 'canvaskit-wasm'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const wasmPath = require.resolve('canvaskit-wasm/bin/canvaskit.wasm')

export const canvasKit: CanvasKit = await CanvasKitInit({
    locateFile: () => wasmPath,
})

const fontPath = fileURLToPath(
    new URL('../../public/fonts/OpenSans-Regular.ttf', import.meta.url),
)
const fontData = readFileSync(fontPath)

export const fontManager: FontMgr = canvasKit.FontMgr.FromData(
    fontData.buffer.slice(
        fontData.byteOffset,
        fontData.byteOffset + fontData.byteLength,
    ) as ArrayBuffer,
)!

export async function initCanvasKit() {}

export const setCanvasStyles = () => {}
