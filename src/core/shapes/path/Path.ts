import { Widget, WidgetProps } from '@/core/shapes/Widget'
import { canvasKit } from '@/core/canvas/Canvas'
import { RGBA } from '@/core/shapes/Color'
import { CANVAS_COLORS } from '@/helpers/Constant'
import { Path as CkPath } from 'canvaskit-wasm'

export interface PathProps extends WidgetProps {
    properties: PathProperties
}

export interface PathProperties {
    color?: RGBA
    strokeWidth?: number
}

export type PathType = 'pen' | 'trail'

export abstract class Path extends Widget {
    private _pathType: PathType
    protected _path: CkPath

    constructor(type: PathType, props: PathProps) {
        super('path', props)
        this._pathType = type
        this._properties = { ...props.properties }
        this._properties.color = this._properties?.color
            ? props.properties.color
            : CANVAS_COLORS.BLACK
        this._path = new canvasKit.Path()
    }

    get pathType(): PathType {
        return this._pathType
    }

    replacePath(newPath: CkPath) {
        this._path = newPath
    }
}
