import {useParams} from "react-router-dom";
import Header from "@/components/board/header/Header.tsx";
import {useQuery} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import SkeletonHeader from "@/components/board/header/SkeletonHeader.tsx";


export default function SingleBoard() {
    const params = useParams()
    const slugId = params?.id
    const token = useBoundStore(useShallow((state) => state.token))

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
    
    return (
        <div className='whiteboard'>
            {
                boardQuery.isPending ? <SkeletonHeader />: null
            }
            {
                boardQuery.isSuccess ? (
                    <Header name={boardQuery.data.name} />
                ) : null
            }
        </div>
    )
}