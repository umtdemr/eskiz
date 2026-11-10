// ipados says it is a mac, touch support tells them apart
export const isIOS = () =>
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
