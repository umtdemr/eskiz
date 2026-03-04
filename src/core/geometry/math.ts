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
