export type RGBA = {
    r: number
    g: number
    b: number
    a: number
}

// will be used when storing.
type IntColor = number & { __brand: 'Color' }
export class ColorConverter {
    static colorFromRGBA(
        r: number,
        g: number,
        b: number,
        a: number = 1,
    ): IntColor {
        if (
            !ColorConverter.isValidRGBValue(r) ||
            !ColorConverter.isValidRGBValue(g) ||
            !ColorConverter.isValidRGBValue(b) ||
            !ColorConverter.isValidAlphaValue(a)
        ) {
            r = g = b = 0
            a = 1
        }
        const alpha = Math.round(a * 255)
        return ((r << 24) | (g << 16) | (b << 8) | alpha) as IntColor
    }

    private static isValidRGBValue(value: number): boolean {
        return Number.isInteger(value) && value >= 0 && value <= 255
    }

    private static isValidAlphaValue(value: number): boolean {
        return value >= 0 && value <= 1
    }
}

/**
 * WCAG
 */
export function isDarkColor(color: RGBA): boolean {
    const toLinear = (c: number) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    const luminance =
        0.2126 * toLinear(color.r) +
        0.7152 * toLinear(color.g) +
        0.0722 * toLinear(color.b)
    return luminance < 0.12
}
