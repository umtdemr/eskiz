import { API_ENDPOINTS } from "@/helpers/Constant";
import { useBoundStore } from "@/store/store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { BoardsWithPagination} from "@/types/Board.ts";

export type SortByFilter = '-created_at' | 'name'

type BoardsApiQuery = {
    is_deleted?: boolean
    is_owner?: boolean
    name?: string
    sort: SortByFilter
}


export function useBoards(props?: BoardsApiQuery) {
    const token = useBoundStore(useShallow((state) => state.token))

   return useInfiniteQuery<BoardsWithPagination>({
        queryKey: ['board_results', token, props],
        queryFn: async ({ pageParam }) => {
            const boardsUrl = new URL(API_ENDPOINTS.BOARDS)

            // set filters
            if (props) {
                for (const [key, value] of Object.entries(props)) {
                    if (value === undefined) continue
                    boardsUrl.searchParams.set(key, value.toString())
                }
            }

            boardsUrl.searchParams.set('page', pageParam!.toString())

            const boardResponse = await fetch(boardsUrl.toString(), {
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
            
            return await boardResponse.json()
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.metadata.current_page + 1 <= lastPage.metadata.last_page) {
                return lastPage.metadata.current_page + 1
            }
            return undefined
        },
    })
}