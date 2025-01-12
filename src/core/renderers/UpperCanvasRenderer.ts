import {collaboratorCursor, CollaboratorsRenderer} from "@/core/renderers/CollaboratorsRenderer.ts";
import {EventCursor} from "@/types/Websocket.ts";
import {Canvas} from "@/core/canvas/Canvas.ts";

function animate({ timing, draw, duration}: { 
    timing: (fraction: number) => number,  draw: (progress: number) => void, duration: number
}) {
    let start = performance.now()
    
    requestAnimationFrame(function animate(time) {
        // timeFraction goes from 0 to 1
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        // calculate the current animation state
        let progress = timing(timeFraction)

        draw(progress); // draw it

        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        }
    })
}

export class UpperCanvasRenderer {
    private _needsRender: boolean = false
    private _upperCanvasEl
    private collaboratorsRenderer: CollaboratorsRenderer
    private collabCursors: collaboratorCursor[] = []
    
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
        this.collaboratorsRenderer.drawCollaborators(this._upperCanvasEl, this.collabCursors)
    }

    requestRender() {
        this._needsRender = true;
    }
    
    handleCursorEvent(msg: EventCursor, canvas: Canvas) {
        // calculate cursor position based on viewport transform
        const actualCursorPosition = canvas.transformPoint({x: msg.data.cursor.x, y: msg.data.cursor.y}, canvas.viewportTransform)
      
        const cursor = this.collabCursors.find(cursor => cursor.user_id === msg.data.cursor.user_id)
        if (!cursor) {
            this.collabCursors.push(msg.data.cursor)
            this.requestRender()
        } else {
            const oldCursorPosition = {
                x: cursor.x,
                y: cursor.y
            }
            
            const cursorPositionDiff = {
                x: actualCursorPosition.x - oldCursorPosition.x,
                y: actualCursorPosition.y - oldCursorPosition.y
            }
            
            animate({
                timing: (timeFraction) => 1 - Math.pow(1 - timeFraction, 3),
                draw: (progress) => {
                    const newX = (oldCursorPosition.x + (cursorPositionDiff.x * progress))
                    const newY = (oldCursorPosition.y + (cursorPositionDiff.y * progress))
                    
                    cursor.x = newX
                    cursor.y = newY
                    this.requestRender()
                },
                duration: 400
            })
        }
    }
    
    set upperCanvasEl(canvas: HTMLCanvasElement) {
        this._upperCanvasEl = canvas
    }
}