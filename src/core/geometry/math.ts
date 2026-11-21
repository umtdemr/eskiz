import { ZOOM_LEVELS } from '@/helpers/Constant'
import { LTRBRect } from './BoundingBox'

export function rotatePoint(
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number,
    angleDegrees: number,
): { x: number; y: number } {
    if (angleDegrees === 0) {
        return { x: pointX, y: pointY }
    }

    const angleRad = (angleDegrees * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)

    // translate point to origin
    const dx = pointX - centerX
    const dy = pointY - centerY

    // rotate point
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos

    // translate point back
    return {
        x: rx + centerX,
        y: ry + centerY,
    }
}

export function reverseRotatePoint(
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number,
    angleDegrees: number,
): { x: number; y: number } {
    return rotatePoint(pointX, pointY, centerX, centerY, -angleDegrees)
}

export type View = { zoom: number; translateX: number; translateY: number }

// zoom and translate that center `rect` on a screen of width x height css
// pixels, with `padding` around it
export function fitView(
    rect: LTRBRect,
    width: number,
    height: number,
    padding: number,
    maxZoom: number,
): View {
    const w = Math.max(width - padding * 2, 1)
    const h = Math.max(height - padding * 2, 1)
    // a widget can be 0 wide, the other side decides then
    const zoom = Math.min(
        w / (rect.right - rect.left),
        h / (rect.bottom - rect.top),
        maxZoom,
        ZOOM_LEVELS.MAX,
    )
    const clamped = Math.max(zoom, ZOOM_LEVELS.MIN)

    return {
        zoom: clamped,
        translateX: width / 2 / clamped - (rect.left + rect.right) / 2,
        translateY: height / 2 / clamped - (rect.top + rect.bottom) / 2,
    }
}

// the zoom changes by the same factor each step. the board point at the screen
// center moves in a straight line, at a steady speed on screen: zooming out it
// pans mostly once far, zooming in mostly while still far
export function interpolateView(
    from: View,
    to: View,
    t: number,
    width: number,
    height: number,
): View {
    const center = (view: View, size: number, translate: number) =>
        size / 2 / view.zoom - translate
    const x0 = center(from, width, from.translateX)
    const y0 = center(from, height, from.translateY)
    const x1 = center(to, width, to.translateX)
    const y1 = center(to, height, to.translateY)

    const ratio = to.zoom / from.zoom
    const zoom = from.zoom * Math.pow(ratio, t)
    // share of the pan done by t, from screen speed ~ board speed * zoom
    const s =
        Math.abs(ratio - 1) < 1e-6
            ? t
            : (1 - Math.pow(ratio, -t)) / (1 - 1 / ratio)

    return {
        zoom,
        translateX: width / 2 / zoom - (x0 + (x1 - x0) * s),
        translateY: height / 2 / zoom - (y0 + (y1 - y0) * s),
    }
}

export const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
