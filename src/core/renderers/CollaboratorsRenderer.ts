const CURSOR_WIDTH = 20;
const CURSOR_HEIGHT = 20;
const RECT_HEIGHT = 25;
const RECT_RADIUS = 7;

export class CollaboratorsRenderer {
    constructor() {
    }

    drawCollaborators(canvasEl: HTMLCanvasElement) {
        const collaborator = {
            x: 700,
            y: 350,
            name: 'umit demir',
            color: 'red'
        }
        
        const ctx = canvasEl.getContext('2d');
        ctx.save()
        // ctx.font = '16px "Open Sans", sans-serif'
        // ctx.fillText("testing", 200, 250)

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
        ctx.fillStyle = collaborator.color
        ctx.fill()
        ctx.restore()
        
        // draw rectangle
        ctx.save()
        const rectanglePos = {
            x: collaborator.x + CURSOR_WIDTH,
            y: collaborator.y + CURSOR_HEIGHT,
        }
        const width= 50;
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
        ctx.fillStyle = collaborator.color
        ctx.fill()
        ctx.restore()
        
        // Draw text
        ctx.save()
        ctx.translate(rectanglePos.x + width / 2, rectanglePos.y + RECT_HEIGHT / 2)
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.font = '14px "Open-Sans", sans-serif';
        ctx.fillStyle = '#f2f2f2';
        ctx.fillText("ümit", 0, 0)
        ctx.restore()

        ctx.restore()
    }
}