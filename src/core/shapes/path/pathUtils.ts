import { getStroke } from 'perfect-freehand'
import { canvasKit } from '@/core/canvas/Canvas'
import { Path as CkPath } from 'canvaskit-wasm'

function med(A: number[], B: number[]) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
}

const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g

export function getSvgPathFromStroke(points: number[][]): string {
    if (!points.length) {
        return ''
    }

    const max = points.length - 1

    return points
        .reduce(
            (acc, point, i, arr) => {
                if (i === max) {
                    acc.push(point, med(point, arr[0]), 'L', arr[0], 'Z')
                } else {
                    acc.push(point, med(point, arr[i + 1]))
                }
                return acc
            },
            ['M', points[0], 'Q'],
        )
        .join(' ')
        .replace(TO_FIXED_PRECISION, '$1')
}

export function reconstructPathFromPoints(
    points: number[][],
    strokeSize: number,
): CkPath | null {
    const stroke = getStroke(points, {
        size: strokeSize,
    })

    // generate path from svg
    const svg = getSvgPathFromStroke(stroke)
    const pathFromSvg = canvasKit.Path.MakeFromSVGString(svg)

    if (pathFromSvg) {
        // paths bound should always start from 0, 0
        const newBounds = pathFromSvg.getBounds()
        const transformMatrix = canvasKit.Matrix.translated(
            -newBounds[0],
            -newBounds[1],
        )
        pathFromSvg.transform(transformMatrix)

        return pathFromSvg
    }

    return null
}
