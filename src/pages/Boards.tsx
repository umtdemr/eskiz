import {Button} from "@/components/ui/button.tsx";
import {LoaderCircle, MousePointer2, Plus} from "lucide-react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import {BoardList} from "@/components/board/boardList/BoardList.tsx";
import {toast} from "react-hot-toast";
import {useNavigate} from "react-router-dom";
import BoardsListSkeleton from "@/components/board/boardList/BoardsListSkeleton.tsx";

export default function BoardsPage() {
    const token = useBoundStore(useShallow((state) => state.token))
    const navigate = useNavigate();

    const boardsQuery = useQuery({
        queryKey: ['board_results', token],
        queryFn: async () => {
            const boardResponse = await fetch(API_ENDPOINTS.BOARDS, {
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
            return jsonResponse.board_results
        },
    })
    
    const createBoard = useMutation({
        mutationFn: () => {
            return fetch(API_ENDPOINTS.CREATE_BOARD, {
                method: 'POST',
                credentials: 'omit',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        },
        onSuccess: async (response) => {
            const data = await response.json()
            if (response.status !== 201) {
                toast.error('error while creating the board. try again later', { id: 'board-err' })
                return
            }
            navigate(`/boards/${data.board.slug_id}/`)
        },
        onError: (error) => {
            toast.error('error while creating the board: ' + error, { id: 'board-err' })
        }
    })
    
    return (
        <>
            <div className=''>
                <div className='flex justify-between'>
                    <span className='text-xl font-bold'>All boards</span>
                    <Button 
                        onClick={() => createBoard.mutate()}
                        disabled={createBoard.isPending}
                        className='bg-indigo-600 hover:bg-indigo-500'>
                        {
                            createBoard.isPending 
                                ? <LoaderCircle className='animate-spin' />
                                : <Plus />
                        }
                         create new
                    </Button>
                </div>
                
                {/*Template*/}
                <div className='flex bg-gray-100 py-5 px-6 mt-5'>
                    <div 
                        role='button'
                        className='group select-none'>
                        <div className=''>
                            <div className='w-40 h-28 flex justify-center items-center bg-slate-50 rounded-lg group-hover:bg-slate-100 group-hover:border-2'>
                                <Plus size={16} />
                            </div>
                            <span className='text-slate-700 text-sm group-hover:text-slate-950'>Blank board</span>
                        </div> 
                    </div>
                </div>


                <div className='flex mt-10 flex-wrap gap-x-5 gap-y-10'>
                    {
                        boardsQuery.isError ? (
                            <div
                                className='w-full relative flex h-40'
                                style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                                <div className='w-full flex justify-center items-center'>
                                    <span className='border-2 p-2 border-blue-200 font-mono text-sm'>
                                        We couldn't load the boards. Try again later.
                                    </span>
                                    <MousePointer2 className='absolute left-[60%] lg:left-[57%] top-[59%] fill-red-500 stroke-red-500' />
                                    <span className='absolute left-[61%] top-[74%] lg:left-[58%]  border-2 rounded-xl p-2 text-xs border-red-500 shadow-md text-white bg-red-500'>
                                        Penelope
                                    </span>
                                </div>
                            </div>
                        ) : null
                    }
                    {
                        boardsQuery.isPending ? <BoardsListSkeleton /> : null
                    }
                    {
                        boardsQuery.isSuccess ? (
                            boardsQuery.data.length ? <BoardList boards={boardsQuery.data} />
                                : <div 
                                    className='w-full relative flex h-40' 
                                    style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                                    <div className='w-full flex justify-center items-center'>
                                        <span className='border-2 p-2 border-blue-200 font-mono text-sm'>
                                            You don't have any board. Create one.
                                        </span>
                                        <MousePointer2 className='absolute left-[60%] lg:left-[57%] top-[59%] fill-red-500 stroke-red-500' />
                                        <span className='absolute left-[61%] top-[74%] lg:left-[58%]  border-2 rounded-xl p-2 text-xs border-red-500 shadow-md text-white bg-red-500'>
                                            Penelope
                                        </span>
                                    </div>
                                </div>
                        ) : null
                    }
                </div>
            </div>
        </>
    )
}