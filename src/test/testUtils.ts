/**
 * Shared helpers for widget/shape tests.
 *
 * The canvas module is mocked globally in setupTests.ts, so importing this
 * from a test file resolves `canvasKit` to the node Skia build.
 */
import { canvasKit } from '@/core/canvas/Canvas'
import type { Engine } from '@/core/engine/Engine'
import type { Widget } from '@/core/shapes/Widget'
import type { RGBA } from '@/core/shapes/Color'

/**
 * Minimal Engine stand-in. Widgets only touch `engine.canvas.requestRender()`
 * outside of the real render loop, so this is enough for unit tests.
 */
export function createEngineStub(): Engine {
    return {
        canvas: {
            requestRender: () => {},
        },
    } as unknown as Engine
}

export interface Pixel {
    r: number
    g: number
    b: number
    a: number
}

export interface RenderedPixels {
    width: number
    height: number
    /** Returns the RGBA pixel (0-255 per channel) at surface coords x,y. */
    pixelAt(x: number, y: number): Pixel
}

/**
 * Renders a widget onto an off-screen CPU surface (transparent background)
 * and returns the resulting pixels for probing.
 */
export function renderToPixels(
    widget: Widget,
    width: number,
    height: number,
): RenderedPixels {
    const surface = canvasKit.MakeSurface(width, height)
    if (!surface) {
        throw new Error('could not create CanvasKit surface')
    }

    const ctx = surface.getCanvas()
    ctx.clear(canvasKit.TRANSPARENT)
    widget.render({ ctx, scale: 1 })
    surface.flush()

    const image = surface.makeImageSnapshot()
    const pixels = image.readPixels(0, 0, {
        width,
        height,
        colorType: canvasKit.ColorType.RGBA_8888,
        alphaType: canvasKit.AlphaType.Unpremul,
        colorSpace: canvasKit.ColorSpace.SRGB,
    }) as Uint8Array | null

    image.delete()
    surface.delete()

    if (!pixels) {
        throw new Error('could not read pixels from CanvasKit surface')
    }

    return {
        width,
        height,
        pixelAt(x: number, y: number): Pixel {
            if (x < 0 || y < 0 || x >= width || y >= height) {
                throw new Error(`pixel (${x}, ${y}) is outside the surface`)
            }
            const i = (y * width + x) * 4
            return {
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2],
                a: pixels[i + 3],
            }
        },
    }
}

/**
 * True when the pixel matches the RGBA color (alpha 0-1 -> 0-255). A small
 * per-channel tolerance absorbs anti-aliasing differences between Skia builds
 * so probes near shape edges don't break on a canvaskit-wasm upgrade.
 */
export function isColor(pixel: Pixel, color: RGBA, tolerance = 2): boolean {
    return (
        Math.abs(pixel.r - color.r) <= tolerance &&
        Math.abs(pixel.g - color.g) <= tolerance &&
        Math.abs(pixel.b - color.b) <= tolerance &&
        Math.abs(pixel.a - Math.round(color.a * 255)) <= tolerance
    )
}

/** True when nothing was drawn at this pixel. */
export function isTransparent(pixel: Pixel): boolean {
    return pixel.a === 0
}

/**
 * Scans the surface (probing every `step` px) and returns the first
 * non-transparent point, or null when nothing was drawn. Assert with
 * `expect(findVisiblePixel(result)).toBeNull()` so a failure reports the
 * offending coordinates.
 */
export function findVisiblePixel(
    result: RenderedPixels,
    step = 5,
): { x: number; y: number } | null {
    for (let x = 0; x < result.width; x += step) {
        for (let y = 0; y < result.height; y += step) {
            if (!isTransparent(result.pixelAt(x, y))) {
                return { x, y }
            }
        }
    }
    return null
}
