import CanvasKitInit, {CanvasKit, Surface} from "canvaskit-wasm";

export class Canvas {
    private _initialized: boolean = false;
    private canvasKit: CanvasKit;
    private surface: Surface
    
    constructor() {
    }
    
    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement;
        if (!canvas) {
            return false;
        }
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        this.canvasKit = await CanvasKitInit({
            locateFile: (file: string) => '/node_modules/canvaskit-wasm/bin/' + file
        })
        
        this.surface = this.canvasKit.MakeWebGLCanvasSurface(canvas)!
        
        const paint = new this.canvasKit.Paint();
        paint.setColor(this.canvasKit.Color4f(0.9, 0, 0, 1.0));
        paint.setStyle(this.canvasKit.PaintStyle.Stroke);
        paint.setAntiAlias(true);
        const rr = this.canvasKit.RRectXY(this.canvasKit.LTRBRect(10, 60, 210, 260), 25, 15);

        const canvasKit = this.canvasKit;
        function draw(canvas) {
            canvas.clear(canvasKit.WHITE);
            canvas.drawRRect(rr, paint);
        }
        this.surface.drawOnce(draw)
        
        return true
    }
    
    get initialized() {
        return this._initialized;
    }

}