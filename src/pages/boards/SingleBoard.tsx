import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/board/header/Header.tsx'
import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/helpers/Constant.ts'
import { useBoundStore } from '@/store/store.ts'
import { useShallow } from 'zustand/react/shallow'
import SkeletonHeader from '@/components/board/header/SkeletonHeader.tsx'
import Toolbar from '@/components/board/toolbar/Toolbar.tsx'
import SkeletonToolbar from '@/components/board/toolbar/SkeletonToolbar.tsx'
import Footer from '@/components/board/footer/Footer.tsx'
import SkeletonFooter from '@/components/board/footer/SkeletonFooter.tsx'
import { Canvas } from '@/core/canvas/Canvas.ts'
import { Engine } from '@/core/engine/Engine.ts'
import { toast } from 'react-hot-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import { CircleX } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { WsErrorMessage, WsResponse } from '@/types/Websocket.ts'
import { BoardRetrieveResponse } from '@/types/Board.ts'
import { getAvatar } from '@/helpers/AuthHelper.ts'
import { CollaboratorUser } from '@/store/collaborators.ts'
import { PageService } from '@/core/services/PageService.ts'

export default function SingleBoard() {
    const [isInitialized, setIsInitialized] = useState(false)
    const params = useParams()
    const slugId = params?.id
    const canvasRef = useRef<Canvas | null>(null)
    const engineRef = useRef<Engine | null>(null)
    const [connectionError, setConnectionError] = useState<WsErrorMessage>(null)
    const disconnectionToastId = useRef('')

    const token = useBoundStore(useShallow((state) => state.token))
    const userData = useBoundStore(useShallow((state) => state.userData))
    const setBoardData = useBoundStore(
        useShallow((state) => state.setBoardData),
    )
    const setCollaborators = useBoundStore(
        useShallow((state) => state.setCollaborators),
    )
    const addToUsers = useBoundStore(useShallow((state) => state.addToUsers))
    const setIsDisconnected = useBoundStore(
        useShallow((state) => state.setIsDisconnected),
    )
    const isDisconnected = useBoundStore(
        useShallow((state) => state.isDisconnected),
    )

    const navigate = useNavigate()

    const boardQuery = useQuery({
        queryKey: ['board', slugId, token],
        queryFn: async () => {
            const boardResponse = await fetch(
                API_ENDPOINTS.BOARD.replace(':slugId', slugId!),
                {
                    method: 'GET',
                    credentials: 'omit',
                    mode: 'cors',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            if (!boardResponse.ok) {
                throw new Error('Network response was not ok')
            }

            const jsonResponse =
                (await boardResponse.json()) as BoardRetrieveResponse
            const boardData = jsonResponse.board.data
            const users = jsonResponse.board.users.map((user) => ({
                full_name: user.full_name,
                id: user.id,
                email: user.email,
                role: user.role,
                avatar: getAvatar(user.full_name),
            }))

            setBoardData({
                id: boardData.id,
                name: boardData.name,
                owner_id: boardData.owner_id,
                created_at: new Date(boardData.created_at),
                slug_id: boardData.slug_id,
            })
            addToUsers(users)
            return boardData
        },
    })

    const processSuccessfulJoin = useCallback(
        async (connectResp: WsResponse<'join'>) => {
            if (connectResp.error) {
                setConnectionError(connectResp.error)
                return
            }

            const collaborators = (connectResp.join?.online_users.map(
                (data) => ({
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.full_name,
                    role: 'editor',
                    avatar: getAvatar(data.user.full_name),
                }),
            ) || []) as CollaboratorUser[]

            const allCollaborators = collaborators.concat({
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                role: 'editor',
                avatar: getAvatar(userData.full_name),
                is_current_user: true,
            })

            setCollaborators(allCollaborators)

            const pageService =
                engineRef.current?.getService<PageService>('page')
            if (boardQuery.data?.pages?.length) {
                const pageDetails = await pageService!.fetchPageDetails(
                    boardQuery.data?.pages[0].id,
                )
                pageService?.addWidgetsToCanvas(
                    pageDetails.fetchPageDetails?.widgets ?? [],
                )
            }

            if (engineRef.current) {
                engineRef.current.run()
            }

            setIsInitialized((prev) => {
                if (!prev) return true
                return prev
            })
        },
        [setCollaborators, userData, boardQuery],
    )

    useEffect(() => {
        const navigateToBoardOnErr = () => {
            engineRef.current?.dispose()
            toast.error('Error while initializing the board')
            navigate('/boards')
        }

        const initializeApp = async () => {
            try {
                engineRef.current = new Engine(
                    slugId!,
                    boardQuery.data?.id!,
                    boardQuery.data?.pages[0].id!,
                )
                await engineRef.current?.initialize()
                canvasRef.current = engineRef.current?.canvas
                const connectResp =
                    await engineRef.current?.wsEngine.connect(token)
                await processSuccessfulJoin(connectResp)
            } catch (err) {
                console.error(err)
                navigateToBoardOnErr()
            }
        }
        if (!boardQuery.isSuccess) {
            return
        }

        if (engineRef.current) {
            if (engineRef.current?.canvas.initialized) return
        }

        initializeApp()
    }, [
        boardQuery,
        userData,
        slugId,
        token,
        setCollaborators,
        navigate,
        processSuccessfulJoin,
    ])

    useEffect(() => {
        if (!isInitialized || !token) {
            return
        }

        const reconnectListener = async () => {
            const connectResp = await engineRef.current?.wsEngine.connect(token)
            await processSuccessfulJoin(connectResp!)
            setIsDisconnected(false)
            toast.success('Reconnected.', {
                id: disconnectionToastId.current,
                duration: 3000,
            })
        }
        const disconnectListener = () => {
            setIsDisconnected(true)
            disconnectionToastId.current = toast.loading(
                'Disconnected. Reconnecting...',
                {
                    id: 'disconnection',
                    duration: Infinity,
                },
            )
        }

        const gaveUpListener = () => {
            toast.error('Sorry, we could not connect you to the server.')
            navigate('/boards')
        }

        engineRef.current?.wsEngine.reconnected.add(reconnectListener)
        engineRef.current?.wsEngine.disconnected.add(disconnectListener)
        engineRef.current?.wsEngine.gaveUp.add(gaveUpListener)

        return () => {
            engineRef.current?.wsEngine.reconnected.remove(reconnectListener)
            engineRef.current?.wsEngine.disconnected.remove(disconnectListener)
            engineRef.current?.wsEngine.gaveUp.remove(gaveUpListener)
        }
    }, [
        isInitialized,
        token,
        processSuccessfulJoin,
        setIsDisconnected,
        navigate,
    ])

    return (
        <div className="whiteboard">
            <div className="canvas_wrapper">
                <canvas id="board"></canvas>
            </div>
            {(boardQuery.isPending || !isInitialized) && !connectionError ? (
                <>
                    <SkeletonHeader />
                    <SkeletonToolbar />
                    <SkeletonFooter />
                </>
            ) : null}
            {boardQuery.isSuccess && isInitialized && !connectionError ? (
                <>
                    <Header engine={engineRef.current!} />
                    {!isDisconnected ? <Toolbar /> : null}
                    {!isDisconnected ? (
                        <Footer engine={engineRef.current!} />
                    ) : null}
                </>
            ) : null}

            {connectionError && !isDisconnected ? (
                <Dialog open={true}>
                    <DialogContent showCloseIcon={false}>
                        <DialogHeader>
                            <DialogTitle className="flex gap-2 items-center">
                                An error occurred
                                <CircleX color="red" />
                            </DialogTitle>
                            <DialogDescription>
                                Sorry but we are not able to open this board for
                                you. Please try again later.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Link to={'/boards'}>
                                <Button>Go to boards</Button>
                            </Link>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    )
}
