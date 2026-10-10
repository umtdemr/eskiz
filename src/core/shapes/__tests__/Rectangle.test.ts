import { describe, it, expect } from 'vitest'
import { Rectangle, RectangleProps } from '../Rectangle'
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

const makeRect = (props?: Partial<RectangleProps>) =>
    new Rectangle(
        {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            properties: {},
            ...props,
        },
        engine,
    )

describe('Rectangle', () => {
    describe('construction', () => {
        it('applies default shape properties', () => {
            const rect = makeRect()

            expect(rect.shapeType).toBe(ShapeType.RECTANGLE)
            expect(rect.widgetType).toBe(WidgetType.SHAPE)
            expect(rect.properties.strokeColor).toEqual(CANVAS_COLORS.BLACK)
            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.TRANSPARENT)
            expect(rect.properties.borderStyle).toBe(BorderStyle.SOLID)
            expect(rect.properties.strokeWidth).toBe(DEFAULT_SHAPE_THICKNESS)
        })

        it('keeps custom properties when provided', () => {
            const rect = makeRect({
                properties: {
                    fillColor: CANVAS_COLORS.RED,
                    strokeColor: CANVAS_COLORS.GREEN,
                    borderStyle: BorderStyle.DASHED,
                    strokeWidth: 6,
                },
            })

            expect(rect.properties.fillColor).toEqual(CANVAS_COLORS.RED)
            expect(rect.properties.strokeColor).toEqual(CANVAS_COLORS.GREEN)
            expect(rect.properties.borderStyle).toBe(BorderStyle.DASHED)
            expect(rect.properties.strokeWidth).toBe(6)
        })

        it('accepts radius within 0-20', () => {
            expect(makeRect({ properties: { radius: 10 } }).properties.radius)
                .toBe(10)
            expect(makeRect({ properties: { radius: 20 } }).properties.radius)
                .toBe(20)
        })

        it('falls back to 0 for out-of-range radius', () => {
            expect(makeRect({ properties: { radius: 25 } }).properties.radius)
                .toBe(0)
            expect(makeRect({ properties: { radius: -5 } }).properties.radius)
                .toBe(0)
        })
    })

    describe('calcTextBounds', () => {
        it('insets the shape bounds by the text padding', () => {
            const rect = makeRect({ width: 100, height: 50 })

            expect(rect.calcTextBounds()).toEqual({
                x: 5,
                y: 5,
                width: 90,
                height: 40,
            })
        })
    })

    describe('roundness', () => {
        it('can change roundness', () => {
            const rect = makeRect()

            expect(rect.canChangeRoundness()).toBe(true)
            expect(rect.changeRoundness(12)).toBe(true)
            expect(rect.properties.radius).toBe(12)
        })

        it('returns false when the radius does not change', () => {
            const rect = makeRect({ properties: { radius: 12 } })

            expect(rect.changeRoundness(12)).toBe(false)
        })
    })

    describe('serialization', () => {
        it('generates full json', () => {
            const rect = new Rectangle(
                {
                    x: 10,
                    y: 20,
                    width: 100,
                    height: 50,
                    uuid: 'rect-uuid',
                    z_index: 'a1',
                    angle: 45,
                    properties: {
                        fillColor: CANVAS_COLORS.RED,
                        radius: 8,
                    },
                },
                engine,
            )

            const json = rect.toJson()
            expect(json).toMatchObject({
                x: 10,
                y: 20,
                width: 100,
                height: 50,
                uuid: 'rect-uuid',
                z_index: 'a1',
                angle: 45,
                widget_type: WidgetType.SHAPE,
                sub_type: ShapeType.RECTANGLE,
                is_deleted: false,
                is_locked: false,
            })
            expect(json.properties.fillColor).toEqual(CANVAS_COLORS.RED)
            expect(json.properties.radius).toBe(8)
        })

        it('json matches snapshot', () => {
            const rect = new Rectangle(
                {
                    x: 10,
                    y: 20,
                    width: 100,
                    height: 50,
                    uuid: 'rect-uuid',
                    z_index: 'a1',
                    properties: {
                        fillColor: CANVAS_COLORS.RED,
                        strokeColor: CANVAS_COLORS.BLACK,
                        borderStyle: BorderStyle.DOTTED,
                        strokeWidth: 4,
                        radius: 8,
                    },
                },
                engine,
            )

            expect(rect.toJson()).toMatchSnapshot()
        })

        it('round-trips through loadFromJson', () => {
            const original = new Rectangle(
                {
                    x: 10,
                    y: 20,
                    width: 100,
                    height: 50,
                    uuid: 'rect-uuid',
                    z_index: 'a1',
                    angle: 90,
                    properties: {
                        fillColor: CANVAS_COLORS.BLUE,
                        strokeWidth: 3,
                        radius: 6,
                    },
                },
                engine,
            )

            const restored = Rectangle.loadFromJson(
                original.toJson() as unknown as RectangleProps,
                engine,
            )

            expect(restored.toJson()).toEqual(original.toJson())
        })
    })

    describe('rendering', () => {
        it('renders fill color inside and nothing outside', () => {
            const rect = new Rectangle(
                {
                    x: 10,
                    y: 10,
                    width: 40,
                    height: 30,
                    properties: { fillColor: CANVAS_COLORS.RED },
                },
                engine,
            )

            const result = renderToPixels(rect, 60, 60)
            expect(isColor(result.pixelAt(30, 25), CANVAS_COLORS.RED)).toBe(
                true,
            )
            expect(isTransparent(result.pixelAt(5, 5))).toBe(true)
            expect(isTransparent(result.pixelAt(55, 45))).toBe(true)
        })

        it('renders the stroke on the border and the fill inside it', () => {
            const rect = new Rectangle(
                {
                    x: 10,
                    y: 10,
                    width: 40,
                    height: 30,
                    properties: {
                        fillColor: CANVAS_COLORS.RED,
                        strokeColor: CANVAS_COLORS.BLACK,
                        strokeWidth: 4,
                    },
                },
                engine,
            )

            const result = renderToPixels(rect, 60, 60)
            // stroke band covers the outer 4px of the shape
            expect(isColor(result.pixelAt(30, 12), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            expect(isColor(result.pixelAt(12, 25), CANVAS_COLORS.BLACK)).toBe(
                true,
            )
            // interior stays the fill color
            expect(isColor(result.pixelAt(30, 25), CANVAS_COLORS.RED)).toBe(
                true,
            )
        })

        it('rounds the corners when a radius is set', () => {
            const props = {
                x: 0,
                y: 0,
                width: 60,
                height: 60,
                properties: { fillColor: CANVAS_COLORS.RED },
            }
            const sharp = new Rectangle(props, engine)
            const rounded = new Rectangle(
                { ...props, properties: { ...props.properties, radius: 20 } },
                engine,
            )

            const sharpPixels = renderToPixels(sharp, 70, 70)
            const roundedPixels = renderToPixels(rounded, 70, 70)

            // the very corner is drawn without a radius but clipped away with one
            expect(isTransparent(sharpPixels.pixelAt(1, 1))).toBe(false)
            expect(isTransparent(roundedPixels.pixelAt(1, 1))).toBe(true)
            // both are filled at the center
            expect(isColor(sharpPixels.pixelAt(30, 30), CANVAS_COLORS.RED)).toBe(
                true,
            )
            expect(
                isColor(roundedPixels.pixelAt(30, 30), CANVAS_COLORS.RED),
            ).toBe(true)
        })

        it('renders gaps for dashed borders but not for solid ones', () => {
            const props = {
                x: 0,
                y: 0,
                width: 80,
                height: 40,
                properties: {
                    strokeColor: CANVAS_COLORS.BLACK,
                    strokeWidth: 4,
                },
            }
            const solid = new Rectangle(props, engine)
            const dashed = new Rectangle(
                {
                    ...props,
                    properties: {
                        ...props.properties,
                        borderStyle: BorderStyle.DASHED,
                    },
                },
                engine,
            )

            const countTransparentOnTopEdge = (rect: Rectangle) => {
                const result = renderToPixels(rect, 90, 50)
                let transparent = 0
                // scan the middle row of the top stroke band, away from corners
                for (let x = 6; x <= 74; x++) {
                    if (isTransparent(result.pixelAt(x, 2))) transparent++
                }
                return transparent
            }

            expect(countTransparentOnTopEdge(solid)).toBe(0)
            expect(countTransparentOnTopEdge(dashed)).toBeGreaterThan(0)
        })

        it('applies rotation around the shape center', () => {
            const rect = new Rectangle(
                {
                    x: 20,
                    y: 40,
                    width: 60,
                    height: 20,
                    angle: 90,
                    properties: {
                        fillColor: CANVAS_COLORS.RED,
                        strokeColor: CANVAS_COLORS.RED,
                    },
                },
                engine,
            )

            const result = renderToPixels(rect, 100, 100)
            // rotated 90deg around (50,50) the rect covers x:[40,60] y:[20,80]
            expect(isColor(result.pixelAt(50, 25), CANVAS_COLORS.RED)).toBe(
                true,
            )
            expect(isColor(result.pixelAt(50, 75), CANVAS_COLORS.RED)).toBe(
                true,
            )
            // this point is only covered by the unrotated rect
            expect(isTransparent(result.pixelAt(25, 50))).toBe(true)
        })

        it('does not draw anything for zero-sized shapes', () => {
            const rect = new Rectangle(
                {
                    x: 10,
                    y: 10,
                    width: 0,
                    height: 0,
                    properties: { fillColor: CANVAS_COLORS.RED },
                },
                engine,
            )

            const result = renderToPixels(rect, 30, 30)
            expect(findVisiblePixel(result)).toBeNull()
        })
    })
})
