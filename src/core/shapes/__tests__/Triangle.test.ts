import { describe, it, expect } from 'vitest'
import { Triangle } from '../Triangle'
import { ShapeProps } from '../Shape'
import { WsWidget } from '@/types/Websocket'
import {
    createEngineStub,
    renderToPixels,
    isColor,
    isTransparent,
    findVisiblePixel,
} from '@/test/testUtils'
import {
    BorderStyle,
    CANVAS_COLORS,
    DEFAULT_SHAPE_THICKNESS,
} from '@/helpers/Constant'
import { ShapeType, WidgetType } from '@/core/constants'

const engine = createEngineStub()

const makeTriangle = (props?: Partial<ShapeProps>) =>
    new Triangle(
        {
            x: 0,
            y: 0,
            width: 80,
            height: 60,
            properties: {},
            ...props,
        },
        engine,
    )

describe('Triangle', () => {
    describe('construction', () => {
        it('applies default shape properties', () => {
            const triangle = makeTriangle()

            expect(triangle.shapeType).toBe(ShapeType.TRIANGLE)
            expect(triangle.widgetType).toBe(WidgetType.SHAPE)
            expect(triangle.properties.strokeColor).toEqual(
                CANVAS_COLORS.BLACK,
            )
            expect(triangle.properties.fillColor).toEqual(
                CANVAS_COLORS.TRANSPARENT,
            )
            expect(triangle.properties.borderStyle).toBe(BorderStyle.SOLID)
            expect(triangle.properties.strokeWidth).toBe(
                DEFAULT_SHAPE_THICKNESS,
            )
        })
    })

    describe('calcTextBounds', () => {
        it('places the text box in the lower half of the triangle', () => {
            const triangle = makeTriangle({ width: 80, height: 60 })

            expect(triangle.calcTextBounds()).toEqual({
                x: 25,
                y: 40,
                width: 30,
                height: 20,
            })
        })

        it('never returns negative text bounds for tiny shapes', () => {
            const triangle = makeTriangle({ width: 8, height: 8 })

            const bounds = triangle.calcTextBounds()
            expect(bounds.width).toBe(0)
            expect(bounds.height).toBe(0)
        })
    })

    describe('snap points', () => {
        it('returns apex, corners, slant midpoints and bottom midpoint', () => {
            const triangle = makeTriangle({
                x: 0,
                y: 0,
                width: 80,
                height: 60,
            })

            expect(triangle.getSnapPoints()).toEqual([
                { x: 40, y: 0 }, // top middle (apex)
                { x: 0, y: 60 }, // bottom left
                { x: 80, y: 60 }, // bottom right
                { x: 20, y: 30 }, // left slant mid
                { x: 60, y: 30 }, // right slant mid
                { x: 40, y: 60 }, // bottom mid
            ])
        })

        it('rotates snap points with the widget', () => {
            const triangle = makeTriangle({
                x: 0,
                y: 0,
                width: 80,
                height: 60,
            })
            triangle.rotate(180)

            const [apex] = triangle.getSnapPoints()
            // apex flips to the bottom center
            expect(apex.x).toBeCloseTo(40, 6)
            expect(apex.y).toBeCloseTo(60, 6)
        })
    })

    describe('serialization', () => {
        it('json matches snapshot', () => {
            const triangle = new Triangle(
                {
                    x: 5,
                    y: 15,
                    width: 80,
                    height: 60,
                    uuid: 'triangle-uuid',
                    z_index: 'a3',
                    properties: {
                        fillColor: CANVAS_COLORS.BLUE,
                        strokeWidth: 2,
                    },
                },
                engine,
            )

            expect(triangle.toJson()).toMatchSnapshot()
        })

        it('round-trips through loadFromJson', () => {
            const original = new Triangle(
                {
                    x: 5,
                    y: 15,
                    width: 80,
                    height: 60,
                    uuid: 'triangle-uuid',
                    z_index: 'a3',
                    angle: 120,
                    properties: {
                        fillColor: CANVAS_COLORS.BLUE,
                        borderStyle: BorderStyle.DOTTED,
                    },
                },
                engine,
            )

            const restored = Triangle.loadFromJson(
                original.toJson() as unknown as WsWidget,
                engine,
            )

            expect(restored.toJson()).toEqual(original.toJson())
        })
    })

    describe('rendering', () => {
        it('fills inside the triangle but not the top corners of its box', () => {
            const triangle = makeTriangle({
                properties: { fillColor: CANVAS_COLORS.RED },
            })

            const result = renderToPixels(triangle, 90, 70)
            // centroid area is filled
            expect(isColor(result.pixelAt(40, 40), CANVAS_COLORS.RED)).toBe(
                true,
            )
            // the top-left/top-right of the bounding box are outside the triangle
            expect(isTransparent(result.pixelAt(5, 5))).toBe(true)
            expect(isTransparent(result.pixelAt(75, 5))).toBe(true)
        })

        it('renders the stroke along the bottom edge', () => {
            const triangle = makeTriangle({
                properties: {
                    fillColor: CANVAS_COLORS.RED,
                    strokeColor: CANVAS_COLORS.BLACK,
                    strokeWidth: 4,
                },
            })

            const result = renderToPixels(triangle, 90, 70)
            // bottom edge stroke band
            expect(isColor(result.pixelAt(40, 58), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            // interior above the band stays fill colored
            expect(isColor(result.pixelAt(40, 45), CANVAS_COLORS.RED)).toBe(
                true,
            )
        })

        it('re-creates its cached path when resized', () => {
            const triangle = makeTriangle({
                width: 40,
                height: 40,
                properties: { fillColor: CANVAS_COLORS.RED },
            })

            // first render caches the path for 40x40
            let result = renderToPixels(triangle, 90, 70)
            expect(isTransparent(result.pixelAt(60, 50))).toBe(true)

            triangle.resize({ width: 80, height: 60 })
            result = renderToPixels(triangle, 90, 70)
            // the same point is now inside the bigger triangle
            expect(isColor(result.pixelAt(60, 50), CANVAS_COLORS.RED)).toBe(
                true,
            )
        })

        it('does not draw anything for zero-sized shapes', () => {
            const triangle = makeTriangle({
                width: 0,
                height: 0,
                properties: { fillColor: CANVAS_COLORS.RED },
            })

            const result = renderToPixels(triangle, 30, 30)
            expect(findVisiblePixel(result)).toBeNull()
        })
    })
})
