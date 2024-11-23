import {useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import Header from "@/components/board/header/Header.tsx";
import {useQuery} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import SkeletonHeader from "@/components/board/header/SkeletonHeader.tsx";
import Toolbar from "@/components/board/toolbar/Toolbar.tsx";
import SkeletonToolbar from "@/components/board/toolbar/SkeletonToolbar.tsx";
import Footer from "@/components/board/footer/Footer.tsx";
import SkeletonFooter from "@/components/board/footer/SkeletonFooter.tsx";
import {Canvas} from "@/core/canvas/Canvas.ts";


export default function SingleBoard() {
    const [isInitialized, setIsInitialized] = useState(false);
    const params = useParams()
    const slugId = params?.id
    const token = useBoundStore(useShallow((state) => state.token))
    const canvasRef = useRef<Canvas | null>(null);

    const boardQuery = useQuery({
        queryKey: ['board', slugId, token],
        queryFn: async () => {
            const boardResponse = await fetch(API_ENDPOINTS.BOARD.replace(':slugId', slugId!), {
                method: 'GET',
                credentials: 'omit',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (!boardResponse.ok) {
                throw new Error('Network response was not ok')
            }

            const jsonResponse = await boardResponse.json()
            return jsonResponse.board
        },
    })
    
    useEffect(() => {
        const initializeCanvas = async () => {
            canvasRef.current = new Canvas();
            await canvasRef.current?.initialize()
            canvasRef.current?.draw()
            setIsInitialized(true)
        }
        if (!boardQuery.isSuccess) {
            return
        }
        
        if (canvasRef.current) {
            if (canvasRef.current?.initialized) return
        }
        
        
        initializeCanvas()
    }, [boardQuery.isSuccess])
    
    return (
        <div className='whiteboard'>
            <div className='canvas_wrapper'>
                <canvas id='board'></canvas>
            </div>
            {
                (boardQuery.isPending || !isInitialized) ? (
                    <>
                        <SkeletonHeader />
                        <SkeletonToolbar />
                        <SkeletonFooter />
                    </>
                ) : null
            }
            {
                (boardQuery.isSuccess && isInitialized) ? (
                    <>
                        <Header name={boardQuery.data.name} />
                        <Toolbar canvas={canvasRef.current!} />
                        <Footer canvas={canvasRef.current!} />
                    </>
                ) : null
            }
        </div>
    )
}