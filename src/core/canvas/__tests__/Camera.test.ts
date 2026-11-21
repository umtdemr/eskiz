import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Camera } from '../Camera'
import { Signal } from '@/core/signal/Signal'
import { BoundingBox } from '@/core/geometry/BoundingBox'
import type { Canvas } from '../Canvas'
import type { Stage } from '@/core/stage/Stage'

// the parts of the canvas the camera uses, a 1000 x 600 screen
const fakeCanvas = () => ({
    width: 1000,
    height: 600,
    resized: new Signal(),
    tickBefore: new Signal(),
    requestRender: vi.fn(),
})

let canvas: ReturnType<typeof fakeCanvas>
let content: BoundingBox | null
let camera: Camera
let now: number
let reducedMotion: boolean

// a canvas frame at `time` ms
const runFrame = (time: number) => {
    now = time
    canvas.tickBefore.dispatch()
}

describe('Camera', () => {
    beforeEach(() => {
        canvas = fakeCanvas()
        content = null
        now = 0
        reducedMotion = false
        vi.stubGlobal('window', {
            matchMedia: () => ({ matches: reducedMotion }),
        })
        vi.spyOn(performance, 'now').mockImplementation(() => now)

        const stage = { contentBounds: () => content }
        camera = new Camera(
            canvas as unknown as Canvas,
            stage as unknown as Stage,
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('maps between board and screen', () => {
        camera.set({ zoom: 2, translateX: -100, translateY: 50 })

        expect(camera.toScreen({ x: 150, y: 0 })).toEqual({ x: 100, y: 100 })
        expect(camera.toBoard({ x: 100, y: 100 })).toEqual({ x: 150, y: 0 })
        expect(camera.viewport).toEqual({
            left: 100,
            top: -50,
            right: 600,
            bottom: 250,
        })
    })

    it('tells once per change and redraws', () => {
        const changed = vi.fn()
        camera.changed.add(changed)

        camera.set({ zoom: 2, translateX: 10, translateY: 20 })

        expect(changed).toHaveBeenCalledOnce()
        expect(canvas.requestRender).toHaveBeenCalledOnce()
    })

    it('tells the zoom only when it changes', () => {
        const zoomChanged = vi.fn()
        camera.zoomChanged.add(zoomChanged)

        camera.set({ translateX: 10 })
        camera.set({ zoom: 2 })

        expect(zoomChanged.mock.calls).toEqual([[2]])
    })

    it('keeps the zoom in range', () => {
        camera.set({ zoom: 100 })
        expect(camera.zoom).toBe(4)
    })

    it('keeps the point under the cursor when zooming', () => {
        const before = camera.toBoard({ x: 300, y: 200 })

        camera.zoomAt(2, 300, 200)

        expect(camera.toScreen(before)).toEqual({ x: 300, y: 200 })
    })

    it('zooms around the screen center', () => {
        const center = camera.toBoard({ x: 500, y: 300 })

        camera.zoomTo(4)

        expect(camera.toScreen(center)).toEqual({ x: 500, y: 300 })
    })

    it('fits a rect in the middle', () => {
        camera.fit(new BoundingBox(0, 0, 2000, 1000), { padding: 50 })

        expect(camera.zoom).toBeCloseTo(0.45)
        expect(camera.toScreen({ x: 1000, y: 500 }).x).toBeCloseTo(500)
    })

    it('leaves an empty board alone', () => {
        camera.fitContent()

        expect([camera.zoom, camera.translateX]).toEqual([1, 0])
    })

    it('animates to the view', () => {
        const view = { zoom: 2, translateX: -100, translateY: -50 }

        camera.animateTo(view, { duration: 400 })
        runFrame(200)
        expect(camera.zoom).toBeGreaterThan(1)
        expect(camera.zoom).toBeLessThan(2)

        runFrame(400)
        expect(camera.zoom).toBe(2)
        expect(camera.translateX).toBe(-100)
    })

    it('lands exactly on the target', () => {
        // 0.045 * (1 / 0.045) ^ 1 comes out a hair under 1
        camera.set({ zoom: 0.045 })

        camera.animateTo({ zoom: 1, translateX: 0, translateY: 0 })
        runFrame(400)

        expect(camera.zoom).toBe(1)
    })

    it('stops when the view is moved another way', () => {
        camera.animateTo({ zoom: 2, translateX: 0, translateY: 0 })
        runFrame(100)

        // a pan
        camera.set({ translateX: 500 })
        runFrame(400)

        expect(camera.translateX).toBe(500)
        expect(camera.zoom).toBeLessThan(2)
    })

    it('stops when the screen is resized', () => {
        camera.animateTo({ zoom: 2, translateX: 0, translateY: 0 })
        runFrame(100)
        const zoom = camera.zoom

        canvas.resized.dispatch()
        runFrame(400)

        expect(camera.zoom).toBe(zoom)
    })

    it('jumps with reduced motion', () => {
        reducedMotion = true

        camera.animateTo({ zoom: 2, translateX: 10, translateY: 20 })

        expect([camera.zoom, camera.translateX]).toEqual([2, 10])
    })
})
