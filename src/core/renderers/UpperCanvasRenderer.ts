import {CollaboratorsRenderer} from "@/core/renderers/CollaboratorsRenderer.ts";

export class UpperCanvasRenderer {
    private _needsRender: boolean = false
    private _upperCanvasEl
    private collaboratorsRenderer: CollaboratorsRenderer
    
    constructor() {
        this.collaboratorsRenderer = new CollaboratorsRenderer()
    }
    
    run() {
        if (this._needsRender && this._upperCanvasEl) {
            this._needsRender = false;
            this.render()
        }
        window.requestAnimationFrame(this.run.bind(this));
    }
    
    render() {
        this.collaboratorsRenderer.drawCollaborators(this._upperCanvasEl)
    }

    requestRender() {
        this._needsRender = true;
    }
    
    set upperCanvasEl(canvas: HTMLCanvasElement) {
        this._upperCanvasEl = canvas
    }
}