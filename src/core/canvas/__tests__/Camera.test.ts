import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Camera } from '../Camera'
import { Signal } from '@/core/signal/Signal'
import { BoundingBox } from '@/core/geometry/BoundingBox'
import type { Canvas } from '../Canvas'
import type { Stage } from '@/core/stage/Stage'

// the parts of the canvas the camera uses, on a 1000 x 600 screen
const fakeCanvas = () => {
    let zoom = 1
    let x = 0
    let y = 0
    const transform = new Signal()
    return {
        width: 1000,
        height: 600,
        transform,
        resized: new Signal(),
        requestRender: vi.fn(),
        get zoom() {
            return zoom
        },
        set zoom(val: number) {
            zoom = val
            transform.dispatch()
        },
        get translateX() {
            return x
        },
        set translateX(val: number) {
            x = val
            transform.dispatch()
        },
        get translateY() {
            return y
        },
        set translateY(val: number) {
            y = val
            transform.dispatch()
        },
    }
}

let canvas: ReturnType<typeof fakeCanvas>
let content: BoundingBox | null
let camera: Camera
let frames: ((now: number) => void)[]
let reducedMotion: boolean

// where a board point lands on screen
const toScreen = (x: number, y: number) => ({
    x: (x + canvas.translateX) * canvas.zoom,
    y: (y + canvas.translateY) * canvas.zoom,
})

const runFrame = (now: number) => {
    const run = frames
    frames = []
    run.forEach((step) => step(now))
}

describe('Camera', () => {
    beforeEach(() => {
        canvas = fakeCanvas()
        content = null
        frames = []
        reducedMotion = false
        vi.stubGlobal('requestAnimationFrame', (step: () => void) =>
            frames.push(step),
        )
        vi.stubGlobal('cancelAnimationFrame', () => (frames = []))
        vi.stubGlobal('window', {
            matchMedia: () => ({ matches: reducedMotion }),
        })
        vi.spyOn(performance, 'now').mockReturnValue(0)

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

    it('keeps the point under the cursor when zooming', () => {
        const before = { x: 300 / canvas.zoom - canvas.translateX, y: 200 }

        camera.zoomAt(2, 300, 200)

        expect(toScreen(before.x, before.y)).toEqual({ x: 300, y: 200 })
    })

    it('zooms around the screen center', () => {
        camera.zoomTo(4)

        expect(toScreen(500, 300)).toEqual({ x: 500, y: 300 })
    })

    it('fits a rect in the middle and tells the zoom', () => {
        const changed = vi.fn()
        camera.zoomChanged.add(changed)

        camera.fit(new BoundingBox(0, 0, 2000, 1000), { padding: 50 })

        expect(canvas.zoom).toBeCloseTo(0.45)
        expect(toScreen(1000, 500).x).toBeCloseTo(500)
        expect(changed).toHaveBeenCalledWith(canvas.zoom)
    })

    it('leaves an empty board alone', () => {
        camera.fitContent()

        expect([canvas.zoom, canvas.translateX]).toEqual([1, 0])
    })

    it('animates to the view', () => {
        const view = { zoom: 2, translateX: -100, translateY: -50 }

        camera.animateTo(view, { duration: 400 })
        runFrame(200)
        expect(canvas.zoom).toBeGreaterThan(1)
        expect(canvas.zoom).toBeLessThan(2)

        runFrame(400)
        expect(canvas.zoom).toBeCloseTo(2)
        expect(canvas.translateX).toBeCloseTo(-100)
        expect(frames).toEqual([])
    })

    it('stops when the view is moved another way', () => {
        camera.animateTo({ zoom: 2, translateX: 0, translateY: 0 })
        runFrame(100)

        // a pan
        canvas.translateX = 500
        runFrame(400)

        expect(canvas.translateX).toBe(500)
        expect(canvas.zoom).toBeLessThan(2)
    })

    it('stops when the screen is resized', () => {
        camera.animateTo({ zoom: 2, translateX: 0, translateY: 0 })
        runFrame(100)
        const zoom = canvas.zoom

        canvas.resized.dispatch()
        runFrame(400)

        expect(canvas.zoom).toBe(zoom)
    })

    it('jumps with reduced motion', () => {
        reducedMotion = true

        camera.animateTo({ zoom: 2, translateX: 10, translateY: 20 })

        expect([canvas.zoom, canvas.translateX]).toEqual([2, 10])
        expect(frames).toEqual([])
    })
})
