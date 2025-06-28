import { Button } from '@/components/ui/button.tsx'
import { LoaderCircle, Plus } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/helpers/Constant.ts'
import { useBoundStore } from '@/store/store.ts'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { SortByFilter, useBoards } from '@/hooks/UseBoards'
import Filter from '@/components/board/boardList/Filter'
import { useRef, useState } from 'react'
import { BoardListWrapper } from '@/components/board/boardList/BoardListWrapper.tsx'

export type OwnedByFilter = {
    isOwner?: boolean
}

export default function BoardsPage() {
    const [ownedByFilter, setOwnedByFilter] = useState<OwnedByFilter>({})
    const [sortByFilter, setSortByFilter] =
        useState<SortByFilter>('-created_at')
    const token = useBoundStore(useShallow((state) => state.token))
    const nextPageLoaderRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    const boardsFilter = {
        is_deleted: false,
        is_owner: ownedByFilter?.isOwner,
        sort: sortByFilter,
    }
    const boardsQuery = useBoards(boardsFilter, nextPageLoaderRef)

    const createBoard = useMutation({
        mutationFn: () => {
            return fetch(API_ENDPOINTS.CREATE_BOARD, {
                method: 'POST',
                credentials: 'omit',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
        },
        onSuccess: async (response) => {
            const data = await response.json()
            if (response.status !== 201) {
                toast.error('error while creating the board. try again later', {
                    id: 'board-err',
                })
                return
            }
            navigate(`/boards/${data.board.slug_id}/`)
        },
        onError: (error) => {
            toast.error('error while creating the board: ' + error, {
                id: 'board-err',
            })
        },
    })

    return (
        <>
            <div className="">
                <div className="flex justify-between">
                    <h2 className="text-xl font-bold">All boards</h2>
                    <Button
                        onClick={() => createBoard.mutate()}
                        disabled={createBoard.isPending}
                        className="bg-indigo-600 hover:bg-indigo-500"
                    >
                        {createBoard.isPending ? (
                            <LoaderCircle className="animate-spin" />
                        ) : (
                            <Plus />
                        )}
                        create new
                    </Button>
                </div>

                {/*Template*/}
                <div className="flex bg-gray-100 py-5 px-6 mt-5">
                    <div role="button" className="group select-none">
                        <div className="">
                            <div className="w-40 h-28 flex justify-center items-center bg-slate-50 rounded-lg group-hover:bg-slate-100 group-hover:border-2">
                                <Plus size={16} />
                            </div>
                            <span className="text-slate-700 text-sm group-hover:text-slate-950">
                                Blank board
                            </span>
                        </div>
                    </div>
                </div>
                <div className="my-10">
                    <Filter
                        ownedByFilter={ownedByFilter}
                        changeOwnedByFilter={(data: { isOwner?: boolean }) =>
                            setOwnedByFilter(data)
                        }
                        sortByFilter={sortByFilter}
                        changeSortByFilter={(newSortFilter: SortByFilter) =>
                            setSortByFilter(newSortFilter)
                        }
                    />
                </div>
                <BoardListWrapper
                    boardsQuery={boardsQuery}
                    ref={nextPageLoaderRef}
                />
            </div>
        </>
    )
}
