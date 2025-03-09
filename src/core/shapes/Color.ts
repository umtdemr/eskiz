
export type RGBA = {
    r: number
    g: number
    b: number
    a: number
}

// will be used when storing.
type IntColor = number & { __brand: 'Color' };
export class ColorConverter {
    static colorFromRGBA(r: number, g: number, b: number, a: number = 1): IntColor {
        if (!ColorConverter.isValidRGBValue(r) ||
            !ColorConverter.isValidRGBValue(g) ||
            !ColorConverter.isValidRGBValue(b) ||
            !ColorConverter.isValidAlphaValue(a)) {
            r = g = b = 0
            a = 1
        }
        const alpha = Math.round(a * 255);
        return ((r << 24) | (g << 16) | (b << 8) | alpha) as IntColor;
    }
    

    private static isValidRGBValue(value: number): boolean {
        return Number.isInteger(value) && value >= 0 && value <= 255;
    }

    private static isValidAlphaValue(value: number): boolean {
        return value >= 0 && value <= 1;
    }
}