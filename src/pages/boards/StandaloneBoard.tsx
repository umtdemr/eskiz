import { useEffect, useRef, useState } from 'react'
import Header from '@/components/board/header/Header.tsx'
import Toolbar from '@/components/board/toolbar/Toolbar.tsx'
import Subtoolbar from '@/components/board/subToolbar/Subtoolbar'
import Footer from '@/components/board/footer/Footer.tsx'
import SkeletonHeader from '@/components/board/header/SkeletonHeader.tsx'
import SkeletonToolbar from '@/components/board/toolbar/SkeletonToolbar.tsx'
import SkeletonFooter from '@/components/board/footer/SkeletonFooter.tsx'
import { Engine } from '@/core/engine/Engine.ts'
import { initCanvasKit } from '@/core/canvas/Canvas.ts'
import { PageService } from '@/core/services/PageService.ts'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useBoundStore } from '@/store/store.ts'
import { initializeAllWidgets } from '@/core/initializers/registerWidgets.ts'

const DEFAULT_SLUG = 'local'
const DEFAULT_BOARD_ID = 1
const DEFAULT_PAGE_ID = 1

export default function StandaloneBoard() {
    const [isInitialized, setIsInitialized] = useState(false)
    const engineRef = useRef<Engine | null>(null)
    const whiteboardRef = useRef<HTMLDivElement>(null)

    const setBoardData = useBoundStore((state) => state.setBoardData)

    useEffect(() => {
        const el = whiteboardRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
            }
        }
        el.addEventListener('wheel', handler, { passive: false })
        return () => el.removeEventListener('wheel', handler)
    }, [])

    useEffect(() => {
        const initializeApp = async () => {
            try {
                initializeAllWidgets()
                await initCanvasKit()
                engineRef.current = new Engine(
                    DEFAULT_SLUG,
                    DEFAULT_BOARD_ID,
                    DEFAULT_PAGE_ID,
                )
                await engineRef.current.initialize()

                // set default board data in store
                setBoardData({
                    id: DEFAULT_BOARD_ID,
                    name: 'My Whiteboard',
                    owner_id: 0,
                    created_at: new Date(),
                    slug_id: DEFAULT_SLUG,
                })

                // load saved widgets from IndexedDB
                const pageService =
                    engineRef.current.getService<PageService>('page')
                const pageDetails =
                    await pageService.fetchPageDetails(DEFAULT_PAGE_ID)
                pageService.addWidgetsToCanvas(pageDetails.widgets ?? [])

                engineRef.current.run()
                setIsInitialized(true)
            } catch (err) {
                console.error('failed to initialize standalone board:', err)
            }
        }

        if (engineRef.current?.canvas.initialized) return

        initializeApp()
    }, [setBoardData])

    return (
        <TooltipProvider delayDuration={0}>
            <div className="whiteboard" ref={whiteboardRef}>
                <div className="canvas_wrapper">
                    <canvas id="board"></canvas>
                </div>
                {!isInitialized ? (
                    <>
                        <SkeletonHeader />
                        <SkeletonToolbar />
                        <SkeletonFooter />
                    </>
                ) : null}
                {isInitialized ? (
                    <>
                        <Header engine={engineRef.current!} />
                        <Toolbar engine={engineRef.current!} />
                        <Subtoolbar engine={engineRef.current!} />
                        <Footer engine={engineRef.current!} />
                    </>
                ) : null}
            </div>
        </TooltipProvider>
    )
}
