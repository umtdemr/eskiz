import { Engine } from "../engine/Engine";
import { SelectionService } from "../services/SelectionService";
import { Layer } from "./Layer";

export class SelectionLayer extends Layer {
    private engine: Engine
    private selectionService: SelectionService

    constructor(engine: Engine, selectionService: SelectionService) {
        super({ name: 'selection_layer' })
        this.engine = engine;
        this.selectionService = selectionService
    }
}