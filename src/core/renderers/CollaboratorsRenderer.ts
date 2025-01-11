import {getTextDimension} from "@/helpers/TextHelpers.ts";

const CURSOR_WIDTH = 20;
const CURSOR_HEIGHT = 20;
const RECT_HEIGHT = 25;
const RECT_RADIUS = 7;

export type collaboratorCursor = {x: number, y: number, user_name: string, user_id: number}

export class CollaboratorsRenderer {
    
    constructor() {

    }

    drawCollaborators(canvasEl: HTMLCanvasElement, collaborators: collaboratorCursor[]) {
        const ctx = canvasEl.getContext('2d');
        // clear the upper canvas
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        for (const collaborator of collaborators) {
            if (!collaborator) {
                continue
            }
            ctx.save()
            // Draw cursor
            ctx.save()
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.translate(collaborator.x, collaborator.y)
            const degree = 320 * Math.PI / 180; // rotate 320 degrees
            ctx.rotate(degree)
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(0 - CURSOR_WIDTH / 2, CURSOR_HEIGHT)
            ctx.lineTo(0 , CURSOR_HEIGHT * 0.7)
            ctx.lineTo(CURSOR_WIDTH / 2, CURSOR_HEIGHT)
            ctx.lineTo(0, 0)
            ctx.fillStyle = '#000'
            ctx.fill()
            ctx.restore()

            const textMeasurement = getTextDimension(collaborator.user_name, '14px "Open-Sans", sans_serif')

            // draw rectangle
            ctx.save()
            const rectanglePos = {
                x: collaborator.x + CURSOR_WIDTH,
                y: collaborator.y + CURSOR_HEIGHT,
            }
            const width= textMeasurement.width + 20; // here, 20 is padding.
            ctx.translate(rectanglePos.x, rectanglePos.y)
            ctx.beginPath();
            ctx.moveTo(RECT_RADIUS, 0);
            ctx.lineTo(width - RECT_RADIUS, 0);
            ctx.quadraticCurveTo(width, 0, width, RECT_RADIUS);
            ctx.lineTo(width, RECT_HEIGHT - RECT_RADIUS);
            ctx.quadraticCurveTo(width, RECT_HEIGHT, width - RECT_RADIUS, RECT_HEIGHT);
            ctx.lineTo(RECT_RADIUS, RECT_HEIGHT);
            ctx.quadraticCurveTo(0, RECT_HEIGHT, 0, RECT_HEIGHT - RECT_RADIUS);
            ctx.lineTo(0, RECT_RADIUS);
            ctx.quadraticCurveTo(0, 0, RECT_RADIUS, 0);
            ctx.closePath();
            ctx.fillStyle = '#000'
            ctx.fill()
            ctx.restore()

            // Draw text
            ctx.save()
            ctx.translate(rectanglePos.x + width / 2, rectanglePos.y + RECT_HEIGHT / 2)
            // since ctx is translated into the center of the rectangle, just center the text
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.font = '14px "Open-Sans", sans-serif';
            ctx.fillStyle = '#f2f2f2';
            ctx.fillText(collaborator.user_name, 0, 0)
            ctx.restore()

            ctx.restore() 
        }
    }
}