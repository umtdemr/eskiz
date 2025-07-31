import { Layer } from '@/core/stage/Layer'
import { Engine } from '@/core/engine/Engine'

export class TrailLayer extends Layer {
    private engine: Engine
    private points: number[][]

    constructor(engine: Engine) {
        super({ name: 'trail_layer' })
        this.engine = engine

        this.points = []
    }

    start(x: number, y: number) {
        this.points.push([x, y])
    }

    update(x: number, y: number) {
        this.points.push([x, y])
    }
    finish() {
        this.points = []
    }
}
