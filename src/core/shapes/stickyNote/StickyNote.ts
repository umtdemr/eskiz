import { Widget, WidgetJson, WidgetProps } from '@/core/shapes/Widget'
import { Engine } from '@/core/engine/Engine'
import { canvasKit, RenderContext } from '@/core/canvas/Canvas'
import { WsWidget } from '@/types/Websocket'
import { StickyNoteType, TextAlign, WidgetType } from '@/core/constants'
import {
    ShapeText,
    ShapeTextConstructProps,
} from '@/core/shapes/text/ShapeText'
import { TextOp } from '@/core/textEditor/TextEditor'
import { FontStyleType } from '@/helpers/Constant'
import { RGBA } from '@/core/shapes/Color'

export interface StickyNoteProps extends WidgetProps {
    properties: StickyNoteProperties
}

export interface StickyNoteProperties {
    fillColor?: RGBA
    textProperties?: ShapeTextConstructProps
    autoFontSize?: boolean
}

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 310
const DEFAULT_FILL_COLOR: RGBA = { r: 255, g: 232, b: 150, a: 1 }
const TEXT_PADDING = 16
const CORNER_RADIUS = 12

const SHADOW_BLUR = 20
const SHADOW_OFFSET_Y = 20
const SHADOW_COLOR = { r: 0, g: 0, b: 0, a: 0.15 }

// Auto font size limits
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 72
const DEFAULT_FONT_SIZE = 18

const initialTextProps: ShapeTextConstructProps = {
    text: '',
    fontSize: DEFAULT_FONT_SIZE,
    lineHeight: 1.4,
    textAlign: TextAlign.CENTER,
}

export class StickyNote extends Widget {
    protected _text: ShapeText | null = null
    protected _textProperties: ShapeTextConstructProps
    protected _fillColor: RGBA
    protected _autoFontSize: boolean = true

    constructor(props: StickyNoteProps, engine: Engine) {
        // Set default dimensions if not provided
        const width = props.width || DEFAULT_WIDTH
        const height = props.height || DEFAULT_HEIGHT

        super(WidgetType.STICKY_NOTE, { ...props, width, height }, engine)

        this._fillColor = props.properties.fillColor || DEFAULT_FILL_COLOR
        this._textProperties = props.properties.textProperties || {
            ...initialTextProps,
        }
        this._autoFontSize = props.properties.autoFontSize ?? true // Default to auto
        this._interactive = true

        // Create text object if there's initial text
        if (this._textProperties.text) {
            this.createTextObject()
        }
    }

    protected renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx

        if (this._width <= 0 || this._height <= 0) {
            return
        }

        // Draw box shadow
        this.drawShadow(ctx)

        // Draw the rounded rectangle background
        const paint = new canvasKit.Paint()
        paint.setAntiAlias(true)
        paint.setStyle(canvasKit.PaintStyle.Fill)
        paint.setColor(
            canvasKit.Color(
                this._fillColor.r,
                this._fillColor.g,
                this._fillColor.b,
                this._fillColor.a,
            ),
        )

        const rect = canvasKit.LTRBRect(0, 0, this._width, this._height)
        const rrect = canvasKit.RRectXY(rect, CORNER_RADIUS, CORNER_RADIUS)
        ctx.drawRRect(rrect, paint)
        paint.delete()
    }

    private drawShadow(ctx: CanvasRenderingContext2D | any) {
        const shadowPaint = new canvasKit.Paint()
        shadowPaint.setAntiAlias(true)
        shadowPaint.setStyle(canvasKit.PaintStyle.Fill)
        shadowPaint.setColor(
            canvasKit.Color(
                SHADOW_COLOR.r,
                SHADOW_COLOR.g,
                SHADOW_COLOR.b,
                SHADOW_COLOR.a,
            ),
        )

        // Create blur effect for shadow
        const blurFilter = canvasKit.MaskFilter.MakeBlur(
            canvasKit.BlurStyle.Normal,
            SHADOW_BLUR / 2,
            true,
        )
        shadowPaint.setMaskFilter(blurFilter)

        // Shadow rect is offset
        const shadowRect = canvasKit.LTRBRect(
            0,
            SHADOW_OFFSET_Y,
            this._width,
            this._height + SHADOW_OFFSET_Y,
        )
        const shadowRRect = canvasKit.RRectXY(
            shadowRect,
            CORNER_RADIUS,
            CORNER_RADIUS,
        )
        ctx.drawRRect(shadowRRect, shadowPaint)

        shadowPaint.delete()
    }

    protected createTextObject() {
        this._text = new ShapeText(
            {
                ...this.calcTextBounds(),
                properties: {
                    ...this._textProperties,
                },
            },
            this._engine,
        )

        this.addChildren(this._text)
    }

    calcTextBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: TEXT_PADDING,
            y: TEXT_PADDING,
            width: this._width - TEXT_PADDING * 2,
            height: this._height - TEXT_PADDING * 2,
        }
    }

    startEditingText() {
        if (!this._text) {
            this._textProperties = { ...initialTextProps }
            this.createTextObject()
            this._text!.hideText()
            return
        }

        this._text.hideText()
    }

    finishEditingText() {
        if (!this._text) return
        this._text.showText()
    }

    updateText(text: string, textOps: TextOp[]) {
        if (!this._text) return
        this._text.setTextOps(text, textOps)
        this._textProperties.text = text
        this._textProperties.textOps = textOps

        // Auto-adjust font size if enabled
        if (this._autoFontSize && text.trim().length > 0) {
            this.calculateAndApplyOptimalFontSize()
        }
    }

    /**
     * Calculate the optimal font size that fits the text within the available bounds.
     * Uses binary search for efficiency.
     */
    private calculateAndApplyOptimalFontSize(): void {
        if (!this._text) return

        const bounds = this.calcTextBounds()
        const availableHeight = bounds.height

        let minSize = MIN_FONT_SIZE
        let maxSize = MAX_FONT_SIZE
        let optimalSize = MIN_FONT_SIZE

        // Binary search to find the largest font size that fits
        while (minSize <= maxSize) {
            const midSize = Math.floor((minSize + maxSize) / 2)
            const textHeight = this._text.calculateHeightAtFontSize(midSize)

            if (textHeight <= availableHeight) {
                optimalSize = midSize
                minSize = midSize + 1
            } else {
                maxSize = midSize - 1
            }
        }

        // Apply the optimal font size
        if (this._textProperties.fontSize !== optimalSize) {
            this._textProperties.fontSize = optimalSize
            this._text.changeFontSize(optimalSize)
        }
    }

    canChangeBgColor(): boolean {
        return true
    }

    changeBgColor(newColor: RGBA): boolean {
        this._fillColor = newColor
        return true
    }

    canChangeTextColor(): boolean {
        return false
    }

    canChangeFontSize(): boolean {
        // manual font size changes are disabled when auto font size is on
        return (
            !this._autoFontSize &&
            this._text !== null &&
            this._text !== undefined
        )
    }

    changeFontSize(newSize: number): boolean {
        if (!this._text) return false
        if (this._textProperties.fontSize === newSize) return false
        this._textProperties.fontSize = newSize
        this._text.changeFontSize(newSize)
        return true
    }

    canChangeFontStyle(): boolean {
        return this._text !== null && this._text !== undefined
    }

    changeFontStyle(style: FontStyleType, value: boolean): boolean {
        if (!this._text) return false

        const textOps = this._textProperties.textOps || []
        const updatedOps = textOps.map((op) => ({
            ...op,
            attributes: {
                ...op.attributes,
                [style]: value,
            },
        }))

        this._textProperties.textOps = updatedOps
        this._text.setTextOps(this._textProperties.text, updatedOps)
        return true
    }

    hasFontStyle(style: FontStyleType): boolean {
        const textOps = this._textProperties?.textOps || []
        if (!textOps.length) return false
        return textOps.some((op) => op.attributes[style] === true)
    }

    resize(opt: {
        left?: number
        top?: number
        width?: number
        height?: number
    }): boolean {
        const resized = super.resize(opt)

        // if resized, update text bounding
        if (resized && this._text) {
            const bounds = this.calcTextBounds()
            this._text.resize({
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
            })
        }

        return resized
    }

    get textStr(): string {
        if (this._text) {
            return this._text?.text
        }
        return ''
    }

    get textProperties(): ShapeTextConstructProps {
        return this._textProperties
    }

    get properties() {
        return {
            fillColor: this._fillColor,
            textProperties: this._textProperties,
            autoFontSize: this._autoFontSize,
        }
    }

    canSnap(): boolean {
        return true
    }

    getSnapPoints(): { x: number; y: number }[] {
        const bounds = this.bounds
        return [
            { x: bounds.x + bounds.width / 2, y: bounds.y }, // top center
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // bottom center
            { x: bounds.x, y: bounds.y + bounds.height / 2 }, // left center
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // right center
        ]
    }

    toJson(): WidgetJson {
        const data: WidgetJson = {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: WidgetType.STICKY_NOTE,
            sub_type: StickyNoteType.STICKY_NOTE,
            properties: this.properties,
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
        }

        if (this._parent_widget_id) {
            data.parent_widget_id = this._parent_widget_id
        }

        return data
    }

    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json)

        if (json.properties?.textProperties) {
            const textProps = json.properties
                .textProperties as ShapeTextConstructProps
            this._textProperties = {
                ...this._textProperties,
                ...textProps,
            }

            if (this._text) {
                if (textProps.text !== undefined && textProps.textOps) {
                    this._text.setTextOps(textProps.text, textProps.textOps)
                }
                if (textProps.fontSize !== undefined) {
                    this._text.changeFontSize(textProps.fontSize)
                }
            } else if (textProps.text) {
                this.createTextObject()
            }
        }

        if (json.properties?.fillColor) {
            this._fillColor = json.properties.fillColor as RGBA
        }

        if ((json.width || json.height) && this._text) {
            const bounds = this.calcTextBounds()
            this._text.left = bounds.x
            this._text.top = bounds.y
            this._text.width = bounds.width
            this._text.height = bounds.height
            this._text.createOrUpdateParagraph()
        }
    }

    static loadFromJson(json: WsWidget, engine: Engine): StickyNote {
        const properties = json.properties as unknown as StickyNoteProperties
        return new StickyNote(
            {
                x: json.x,
                y: json.y,
                width: json.width,
                height: json.height,
                uuid: json.uuid,
                z_index: json.z_index,
                is_locked: json.is_locked,
                parent_widget_id: json.parent_widget_id,
                properties: {
                    fillColor: properties.fillColor,
                    textProperties: properties.textProperties,
                },
            },
            engine,
        )
    }

    get autoFontSize(): boolean {
        return this._autoFontSize
    }
}
