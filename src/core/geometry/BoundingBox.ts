export type LTRBRect = {
    left: number
    top: number
    right: number
    bottom: number
}
/**
 * Boundingbox is a helper class to make rectangular bounding box calculations
 * and processes easy.
 */
export class BoundingBox {
    private _x: number
    private _y: number
    private _width: number
    private _height: number

    /**
     * 
     * @param x Left of the bbox.
     * @param y Top of the bbox.
     * @param width Width of the bbox.
     * @param height Height of the bbox.
     */
    constructor(x = 0, y = 0, width= 0, height = 0) {
        this._x = x
        this._y = y
        this._width = width
        this._height = height
    }

    static createInfinite(): BoundingBox {
        return new BoundingBox(
            -Infinity,
            -Infinity,
            Infinity,
            Infinity,
        )
    }
    static createIndefinite(): BoundingBox {
        return new BoundingBox(
            Infinity,
            Infinity,
            -Infinity,
            -Infinity,
        )
    }

    static createWithMerge(...rects: LTRBRect[]): BoundingBox {
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        rects.forEach((rect) => {
            left = Math.min(left, rect.left);
            right = Math.max(right, rect.right);
            top = Math.min(top, rect.top);
            bottom = Math.max(bottom, rect.bottom); 
        })
    
        return new BoundingBox(
            left,
            top,
            right - left,
            bottom - top
        )
    }

    get x(): number {
        return this._x;
    }

    set x(val: number) {
        this._x = val;
    }

    get y(): number {
        return this._y;
    }
    
    set y(val: number) {
        this._y = val;
    }

    get width(): number {
        return this._width;
    }

    set width(val: number) {
        this._width = val;
    }

    get height() {
        return this._height;
    }

    set height(val: number) {
        this._height = val;
    }

    get left(): number {
        return this._x
    }

    set left(val: number) {
        this.width += this.x - val;
        this.x = val;
        if (!isFinite(this.width)) this.width = -Infinity
    }

    get top(): number {
        return this._y
    }

    set top(val: number) {
        this.height = val - this.y
        this.y = val
        if (!isFinite(this.height)) this.height = -Infinity;
    }

    get right(): number {
        const right = this._x + this._width
        return isFinite(right) ? right : this.width === Infinity ? Infinity : -Infinity
    }

    set right(val: number) {
        this.width = val - this.x;
        if (!isFinite(this.width)) this.width = -Infinity
    }

    get bottom(): number {
        const bottom = this._y + this.height
        return isFinite(bottom) ? bottom : this.height === Infinity ? Infinity : -Infinity
    }

    set bottom(val: number) {
        this.height = val - this.y
        if (!isFinite(this.height)) this.height = -Infinity
    }

    get centerX(): number {
        return this._x + this._width / 2
    }

    get centerY(): number {
        return this._y + this._height / 2
    }

    get minX(): number {
        return this.left
    }

    set minX(val: number) {
        this.left = val;
    }

    get minY(): number {
        return this.top;
    }

    set minY(val: number) {
        this.top = val;
    }

    get maxX(): number {
        return this.right
    }

    set maxX(val: number) {
        this.right = val;
    }

    get maxY(): number {
        return this.bottom
    }

    set maxY(val: number) {
        this.bottom = val
    }

    /**
     * Merges this bounding box with given rectangles.
     * @param rects List of LTRBRects to merge.
     * @returns Updated bounding box instance.
     */
    merge(...rects: LTRBRect[]) {
        rects.forEach(rect => {
            this.left = Math.min(this.left, rect.left);
            this.right = Math.max(this.right, rect.right);
            this.top = Math.min(this.top, rect.top);
            this.bottom = Math.max(this.bottom, rect.bottom);
        });
        return this;
    }

    /**
     * Sets the bounding box to an indefinite state. Represents an unbounded state.
     * @returns Updated BoundingBox instance.
     */
    indefinite(): BoundingBox {
        this.x = Infinity
        this.y = Infinity
        this.width = -Infinity
        this.height = -Infinity
        return this
    }

    /**
     * Sets the bounding box to an infinite state.
     * @returns Updated BoundingBox instance.
     */
    infinite(): BoundingBox {
        this.x = -Infinity
        this.y = -Infinity
        this.width = Infinity
        this.height = Infinity
        return this
    }

    /**
     * Resets the bounding box. 
     * @returns Updated BoundingBox instance.
     */
    empty(): BoundingBox {
        this.x = this.y = this.width = this.height = 0;
        return this
    }

    /**
     * Checks if all the values are finite numbers.
     * @returns `true` if all the values are finite.
     */
    isFinite(): boolean {
        return isFinite(this.x) && isFinite(this.y) && isFinite(this.width) && isFinite(this.height)
    }

    /**
     * Checks if the bounding box is an infinite state.
     * @returns `true` if the bounding box is infinite.
     */
    isInfinite() {
        return this.width === Infinity || this.height === Infinity
    }

    /**
     * Checks if the bounding box is an indefinite state.
     * @returns `true` if the bounding box is indefinite.
     */
    isIndefinite() {
        return this.width === -Infinity || this.height === -Infinity
    }

    /**
     * Checks if the bounding box is empty.
     * @returns `true` if the bounding box is empty.
     */
    isEmpty(): boolean {
        return this.width === 0 || this.height === 0
    }

    /**
     * Checks if the bounding box contains given point.
     * @param x Point x coordinate
     * @param y Point y coordinate
     * @returns True if it contains
     */
    contains(x: number, y: number): boolean {
        if (this.width <= 0 || this.height <= 0) return false;
        if (x >= this.x && x <= this.x + this.width) {
            if (y >= this.y && y <= this.y + this.height) return true;
        }
        return false;
    }

    /**
     * Checks if the given bounding box contains this bounding box.
     * @param rect Boundingbox instance
     * @returns True if given boundingbox contains this instance
     */
    containsRect(rect: BoundingBox) {
        return this.left <= rect.left && this.right >= rect.right && this.top <= rect.top && this.bottom >= rect.bottom
    }
}