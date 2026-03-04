export const WidgetType = {
    SHAPE: 'shape',
    TEXTBOX: 'textbox',
    SHAPE_TEXT: 'shapeText',
    PATH: 'path',
    MULTI_SELECTOR: 'multiSelector',
    BORDER: 'border',
    CONTROL: 'control',
    LINE: 'line',
    MAGNET_CIRCLE: 'magnetCircle',
    IMAGE: 'image',
    STICKY_NOTE: 'stickyNote',
} as const

export const ShapeType = {
    RECTANGLE: 'rectangle',
    TRIANGLE: 'triangle',
    ELLIPSE: 'ellipse',
} as const

export const PathType = {
    PEN: 'pen',
} as const

export const LineType = {
    LINE: 'line',
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
    N_RESIZE: 'n-resize',
    NE_RESIZE: 'ne-resize',
    E_RESIZE: 'e-resize',
    SE_RESIZE: 'se-resize',
    S_RESIZE: 's-resize',
    SW_RESIZE: 'sw-resize',
    W_RESIZE: 'w-resize',
    NW_RESIZE: 'nw-resize',
    STICKY_NOTE: 'sticky-note',
} as const

export const TextAlign = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
} as const

export const TextSessionType = {
    TEXTBOX: 'textBox',
    SHAPE_TEXT: 'shapeText',
    STICKY_NOTE: 'stickyNote',
} as const

export const BoardGridType = {
    NONE: 'none',
    LINES: 'lines',
    DOTS: 'dots',
} as const

export const ImageType = {
    IMAGE: 'image',
} as const

export const StickyNoteType = {
    STICKY_NOTE: 'stickyNote',
} as const
