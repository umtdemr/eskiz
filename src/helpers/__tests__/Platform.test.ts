import { describe, it, expect, vi, afterEach } from 'vitest'
import { isIOS } from '../Platform'

const as = (userAgent: string, maxTouchPoints = 0) =>
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints })

describe('isIOS', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('detects iphone', () => {
        as('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
        expect(isIOS()).toBe(true)
    })

    it('detects ipad posing as a mac', () => {
        as('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)
        expect(isIOS()).toBe(true)
    })

    it('leaves desktop mac out', () => {
        as('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
        expect(isIOS()).toBe(false)
    })
})
