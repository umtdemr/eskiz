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

// zoom and translate that center `rect` on a screen of width x height css
// pixels, with `padding` around it
export function fitView(
    rect: LTRBRect,
    width: number,
    height: number,
    padding: number,
    maxZoom: number,
) {
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
