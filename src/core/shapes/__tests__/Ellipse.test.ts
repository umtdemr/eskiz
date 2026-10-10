import { describe, it, expect } from 'vitest'
import { Ellipse } from '../Ellipse'
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

const makeEllipse = (props?: Partial<ShapeProps>) =>
    new Ellipse(
        {
            x: 0,
            y: 0,
            width: 80,
            height: 40,
            properties: {},
            ...props,
        },
        engine,
    )

describe('Ellipse', () => {
    describe('construction', () => {
        it('applies default shape properties', () => {
            const ellipse = makeEllipse()

            expect(ellipse.shapeType).toBe(ShapeType.ELLIPSE)
            expect(ellipse.widgetType).toBe(WidgetType.SHAPE)
            expect(ellipse.properties.strokeColor).toEqual(CANVAS_COLORS.BLACK)
            expect(ellipse.properties.fillColor).toEqual(
                CANVAS_COLORS.TRANSPARENT,
            )
            expect(ellipse.properties.borderStyle).toBe(BorderStyle.SOLID)
            expect(ellipse.properties.strokeWidth).toBe(
                DEFAULT_SHAPE_THICKNESS,
            )
        })

        it('does not support roundness', () => {
            expect(makeEllipse().canChangeRoundness()).toBe(false)
        })
    })

    describe('calcTextBounds', () => {
        it('fits the text box into the largest inscribed rectangle', () => {
            const ellipse = makeEllipse({ width: 100, height: 50 })

            const bounds = ellipse.calcTextBounds()
            // largest inscribed rect of an ellipse is w/sqrt(2) x h/sqrt(2),
            // inset by the 5px text padding on each side
            expect(bounds.width).toBeCloseTo(100 / Math.SQRT2 - 10, 5)
            expect(bounds.height).toBeCloseTo(50 / Math.SQRT2 - 10, 5)
            // and it is centered inside the shape
            expect(bounds.x).toBeCloseTo((100 - bounds.width) / 2, 5)
            expect(bounds.y).toBeCloseTo((50 - bounds.height) / 2, 5)
        })

        it('never returns negative text bounds for tiny shapes', () => {
            const ellipse = makeEllipse({ width: 4, height: 4 })

            const bounds = ellipse.calcTextBounds()
            expect(bounds.width).toBe(0)
            expect(bounds.height).toBe(0)
        })
    })

    describe('serialization', () => {
        it('json matches snapshot', () => {
            const ellipse = new Ellipse(
                {
                    x: 15,
                    y: 25,
                    width: 80,
                    height: 40,
                    uuid: 'ellipse-uuid',
                    z_index: 'a2',
                    properties: {
                        fillColor: CANVAS_COLORS.GREEN,
                        strokeColor: CANVAS_COLORS.BLACK,
                        strokeWidth: 3,
                    },
                },
                engine,
            )

            expect(ellipse.toJson()).toMatchSnapshot()
        })

        it('round-trips through loadFromJson', () => {
            const original = new Ellipse(
                {
                    x: 15,
                    y: 25,
                    width: 80,
                    height: 40,
                    uuid: 'ellipse-uuid',
                    z_index: 'a2',
                    angle: 30,
                    properties: {
                        fillColor: CANVAS_COLORS.GREEN,
                        strokeWidth: 3,
                    },
                },
                engine,
            )

            const restored = Ellipse.loadFromJson(
                original.toJson() as unknown as WsWidget,
                engine,
            )

            expect(restored.toJson()).toEqual(original.toJson())
        })
    })

    describe('rendering', () => {
        it('fills the inside of the ellipse but not its bounding box corners', () => {
            const ellipse = makeEllipse({
                properties: { fillColor: CANVAS_COLORS.RED },
            })

            const result = renderToPixels(ellipse, 90, 50)
            // center is filled
            expect(isColor(result.pixelAt(40, 20), CANVAS_COLORS.RED)).toBe(
                true,
            )
            // bounding-box corners are outside the ellipse curve
            expect(isTransparent(result.pixelAt(2, 2))).toBe(true)
            expect(isTransparent(result.pixelAt(77, 2))).toBe(true)
            expect(isTransparent(result.pixelAt(2, 37))).toBe(true)
            expect(isTransparent(result.pixelAt(77, 37))).toBe(true)
        })

        it('renders the stroke on the curve', () => {
            const ellipse = makeEllipse({
                properties: {
                    fillColor: CANVAS_COLORS.RED,
                    strokeColor: CANVAS_COLORS.BLACK,
                    strokeWidth: 4,
                },
            })

            const result = renderToPixels(ellipse, 90, 50)
            // top/bottom/left/right extremes of the curve are stroke colored
            expect(isColor(result.pixelAt(40, 2), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            expect(isColor(result.pixelAt(40, 37), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            expect(isColor(result.pixelAt(2, 20), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            expect(isColor(result.pixelAt(77, 20), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            // interior stays fill colored
            expect(isColor(result.pixelAt(40, 20), CANVAS_COLORS.RED)).toBe(
                true,
            )
        })

        it('honors the shape position', () => {
            const ellipse = makeEllipse({
                x: 30,
                y: 20,
                width: 40,
                height: 40,
                properties: { fillColor: CANVAS_COLORS.BLUE },
            })

            const result = renderToPixels(ellipse, 100, 80)
            expect(isColor(result.pixelAt(50, 40), CANVAS_COLORS.BLUE)).toBe(
                true,
            )
            expect(isTransparent(result.pixelAt(20, 40))).toBe(true)
        })

        it('does not draw anything for zero-sized shapes', () => {
            const ellipse = makeEllipse({
                width: 0,
                height: 0,
                properties: { fillColor: CANVAS_COLORS.RED },
            })

            const result = renderToPixels(ellipse, 30, 30)
            expect(findVisiblePixel(result)).toBeNull()
        })
    })
})
