import CanvasKitInit, {CanvasKit, Surface} from "canvaskit-wasm";

export class Canvas {
    private _initialized: boolean = false;
    private canvasKit: CanvasKit;
    private surface: Surface
    private canvasEl: HTMLCanvasElement
    private upperCanvasEl: HTMLCanvasElement
    private _isPanning = false;
    private startPanX = 0;
    private startPanY = 0;
    private offsetX = 0;
    private offsetY = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;
    private needsRender = false;
    private scale = 1;
    
    constructor() {
    }
    
    async initialize() {
        const canvas = document.querySelector('#board') as HTMLCanvasElement;
        if (!canvas) {
            return false;
        }
        this.canvasEl = canvas
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // create upper canvas
        const upperCanvasEl = document.createElement('canvas')
        upperCanvasEl.width = canvas.width;
        upperCanvasEl.height = canvas.height;
        upperCanvasEl.id = 'upperCanvas'
        
        canvas.parentNode.appendChild(upperCanvasEl)
        this.upperCanvasEl = upperCanvasEl;
        
        // set canvas styles
        this.setCanvasElStyles(this.canvasEl);
        this.setCanvasElStyles(this.upperCanvasEl);

        // initialize canvasKit
        this.canvasKit = await CanvasKitInit({
            locateFile: (file: string) => '/node_modules/canvaskit-wasm/bin/' + file
        })
        
        this.surface = this.canvasKit.MakeWebGLCanvasSurface(canvas)!
        this._initialized = true;
        
        // set event handlers
        this.setEventHandlers(this.upperCanvasEl);
        this.needsRender = true;
        
        return true
    }
    
    get initialized() {
        return this._initialized;
    }
    
    setCanvasElStyles(canvasEl: HTMLCanvasElement) {
        canvasEl.style.position = 'absolute';
        canvasEl.style.left = '0';
        canvasEl.style.top = '0';
        canvasEl.style.cursor = 'grab';
    }
    
    render() {
        const paint = new this.canvasKit.Paint();
        paint.setColor(this.canvasKit.Color4f(0.9, 0, 0, 1.0));
        paint.setStyle(this.canvasKit.PaintStyle.Stroke);
        paint.setAntiAlias(true);

        const path = new this.canvasKit.Path()
        path.moveTo(100, 200)
        path.lineTo(150, 200)
        path.quadTo(300, 300, 350, 400)
        path.close()

        const canvasKit = this.canvasKit;
        const rect = this.canvasKit.LTRBRect(100, 200, 350, 400)

        const offsetX = this.offsetX;
        const offsetY = this.offsetY;


        const surface = this.surface;
        const scale = this.scale;

        function draw(canvas) {
            canvas.clear(canvasKit.WHITE);
            canvas.save()
            canvas.scale(scale, scale)
            canvas.translate(offsetX, offsetY);
            canvas.drawRect(rect, paint);
            canvas.rotate(20, 0, 0)
            canvas.drawPath(path, paint)
            canvas.restore()
        }
        surface.requestAnimationFrame(draw)
    }
    
    draw() {
        if (this.needsRender) {
            this.render()
            this.needsRender = false;
            window.requestAnimationFrame(this.draw.bind(this));
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }
    
    setEventHandlers(canvasEl: HTMLCanvasElement) {
        canvasEl.addEventListener('mousedown', (e: MouseEvent) => {
            this._isPanning = true;
            this.startPanX = e.clientX - this.offsetX * this.scale;
            this.startPanY = e.clientY - this.offsetY * this.scale;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvasEl.style.cursor = 'grabbing';
        });

        canvasEl.addEventListener('mousemove', (e: MouseEvent) => {
            if (this._isPanning) {
                // Calculate velocity based on mouse movement
                const moveSpeed = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
                const speedFactor = Math.max(1, moveSpeed / 10); // Faster mouse = faster pan

                this.offsetX = (e.clientX - this.startPanX) / this.scale * speedFactor;
                this.offsetY = (e.clientY - this.startPanY) / this.scale * speedFactor;
                // this.offsetX = (e.clientX - this.startPanX) / this.scale;
                // this.offsetY = (e.clientY - this.startPanY) / this.scale;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.needsRender = true;
            }
        });

        canvasEl.addEventListener('mouseup', () => {
            this._isPanning = false;
            canvasEl.style.cursor = 'grab';
        });
        
        canvasEl.addEventListener('mousewheel', (e: WheelEvent) => {
            e.preventDefault();
            
            // zooming should be activated with ctrl key
            if (!e.ctrlKey) {
                return
            }
            const mouseX = e.clientX
            const mouseY = e.clientY;

            const zoomFactor = e.deltaY > 0 ? 0.5 : 1.6;
            const oldScale = this.scale;
            this.scale = Math.min(Math.max(0.1, this.scale * zoomFactor), 10.0);

            this.offsetX = mouseX / this.scale - mouseX / oldScale + this.offsetX;
            this.offsetY = mouseY / this.scale - mouseY / oldScale + this.offsetY;
            
            this.needsRender = true
        })
    }

}