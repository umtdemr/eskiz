import { useEffect } from 'react'

// the board handles zoom itself, so keep the browser from zooming the page
export default function useNoBrowserZoom() {
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) e.preventDefault()
        }
        // safari ignores user-scalable=no
        const onGesture = (e: Event) => e.preventDefault()

        const html = document.documentElement
        const touchAction = html.style.touchAction
        // no pinch zoom on the toolbars either, only on board pages
        html.style.touchAction = 'pan-x pan-y'

        const meta = document.querySelector<HTMLMetaElement>(
            'meta[name="viewport"]',
        )
        const viewport = meta?.content ?? ''
        // ios zooms into inputs under 16px and never zooms back
        if (meta) meta.content = `${viewport}, maximum-scale=1`

        document.addEventListener('wheel', onWheel, { passive: false })
        document.addEventListener('gesturestart', onGesture)
        document.addEventListener('gesturechange', onGesture)

        return () => {
            html.style.touchAction = touchAction
            if (meta) meta.content = viewport
            document.removeEventListener('wheel', onWheel)
            document.removeEventListener('gesturestart', onGesture)
            document.removeEventListener('gesturechange', onGesture)
        }
    }, [])
}
