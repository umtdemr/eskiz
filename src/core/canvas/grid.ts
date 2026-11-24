import type { Point } from './Canvas'

/** the snapping step and the finest grid level, in board units */
export const GRID_SIZE = 10

// each level is this many times the one below it
const STEP = 5
// screen pixels between lines where a level starts to fade in.
// it is fully drawn at MIN_SPACING * STEP, so two levels are enough
const MIN_SPACING = 8

export type GridLevel = { size: number; alpha: number }

const logStep = (x: number) => Math.log(x) / Math.log(STEP)

/**
 * the two levels to draw at `zoom`, a finer one fading in and a coarser one
 * in full. the finer one fades in from MIN_SPACING to MIN_SPACING * STEP
 * pixels apart, then it becomes the coarser one
 */
export function gridLevels(zoom: number): [GridLevel, GridLevel] {
    // the finest level at least MIN_SPACING apart, never finer than GRID_SIZE
    const level = Math.max(
        0,
        Math.ceil(logStep(MIN_SPACING / (GRID_SIZE * zoom))),
    )
    const size = GRID_SIZE * STEP ** level
    const alpha = Math.min(Math.max(logStep((size * zoom) / MIN_SPACING), 0), 1)

    return [
        { size, alpha },
        { size: size * STEP, alpha: 1 },
    ]
}

// a line of the finer level that the coarser level already draws
export const onCoarseLine = (index: number) => index % STEP === 0

export const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

export const snapPoint = (p: Point): Point => ({ x: snap(p.x), y: snap(p.y) })
