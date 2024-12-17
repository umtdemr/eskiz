import {useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
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
import {Engine} from "@/core/engine/Engine.ts";
import {toast} from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {CircleX} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {WsErrorMessage} from "@/types/Websocket.ts";


export default function SingleBoard() {
    const [isInitialized, setIsInitialized] = useState(false);
    const params = useParams()
    const slugId = params?.id
    const canvasRef = useRef<Canvas | null>(null);
    const engineRef = useRef<Engine | null>(null)
    const [connectionError, setConnectionError] = useState<WsErrorMessage>(null)
    
    const token = useBoundStore(useShallow((state) => state.token))
    const setCollaborators = useBoundStore(useShallow((state) => state.setCollaborators));
    
    const navigate = useNavigate()

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
        const navigateToBoardOnErr = () => {
            engineRef.current?.dispose()
            toast.error('Error while initializing the board')
            navigate('/boards') 
        }
        const initializeApp = async () => {
            try {
                engineRef.current = new Engine(slugId!)
                const isEngineInitialized = await engineRef.current?.initialize()!;
                canvasRef.current = engineRef.current?.canvas!
                const connectResp = await engineRef.current?.wsEngine.connect(token)!
                if (connectResp.error) {
                    setConnectionError(connectResp.error)
                    return
                }
                
                setCollaborators(connectResp.join?.online_users || [])
                
                let isOkayToProceed = isEngineInitialized! && !!connectResp.join;
                setIsInitialized(isOkayToProceed)
                if (isOkayToProceed) {
                    canvasRef.current?.draw();
                }
            } catch (err) {
                navigateToBoardOnErr();
            }
        }
        if (!boardQuery.isSuccess) {
            return
        }
        
        if (engineRef.current) {
            if (engineRef.current?.canvas.initialized) return
        }
        
        
        initializeApp()
    }, [boardQuery.isSuccess])
    
    return (
        <div className='whiteboard'>
            <div className='canvas_wrapper'>
                <canvas id='board'></canvas>
            </div>
            {
                ((boardQuery.isPending || !isInitialized) && !connectionError) ? (
                    <>
                        <SkeletonHeader />
                        <SkeletonToolbar />
                        <SkeletonFooter />
                    </>
                ) : null
            }
            {
                ((boardQuery.isSuccess && isInitialized) && !connectionError) ? (
                    <>
                        <Header name={boardQuery.data.name} />
                        <Toolbar canvas={canvasRef.current!} />
                        <Footer canvas={canvasRef.current!} />
                    </>
                ) : null
            }

            {
                connectionError ? (
                    <Dialog open={true}>
                        <DialogContent showCloseIcon={false}>
                            <DialogHeader>
                                <DialogTitle className='flex gap-2 items-center'>
                                    An error occurred
                                    <CircleX color='red' />
                                </DialogTitle>
                                <DialogDescription>Sorry but we are not able to open this board for you. Please try again later.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Link to={'/boards'}>
                                    <Button>Go to boards</Button>
                                </Link>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : null
            }
        </div>
    )
}