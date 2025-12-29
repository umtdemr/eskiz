export const WidgetType = {
    SHAPE: 'shape',
    TEXTBOX: 'textbox',
    SHAPE_TEXT: 'shapeText',
    PATH: 'path',
    MULTI_SELECTOR: 'multiSelector',
    BORDER: 'border',
    CONTROL: 'control',
} as const

export const ShapeType = {
    RECTANGLE: 'rectangle',
    TRIANGLE: 'triangle',
    ELLIPSE: 'ellipse',
} as const

export const PathType = {
    PEN: 'pen',
} as const

export const TextType = {
    TEXTBOX: 'textbox',
    SHAPE_TEXT: 'shapeText',
} as const

export const PathToolType = {
    PEN: 'pen',
    ERASER: 'eraser',
} as const

export const CursorType = {
    DEFAULT: 'default',
    POINTER: 'pointer',
    PAN: 'pan',
    PANNING: 'panning',
    CROSSHAIR: 'crosshair',
    TEXT: 'text',
    HORIZONTAL_RESIZE: 'horizontal-resize',
    VERTICAL_RESIZE: 'vertical-resize',
    SCALE_RESIZE_LEFT: 'scale-resize-left',
    SCALE_RESIZE_RIGHT: 'scale-resize-right',
} as const

export const TextAlign = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
} as const

export const TextSessionType = {
    TEXTBOX: 'textBox',
    SHAPE_TEXT: 'shapeText',
} as const
