import { API_ENDPOINTS } from "@/helpers/Constant";
import { useBoundStore } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

export type SortByFilter = '-created_at' | 'name'

type BoardsApiQuery = {
    is_deleted?: boolean
    is_owner?: boolean
    name?: string
    sort: SortByFilter
}


export function useBoards(props?: BoardsApiQuery) {
    const token = useBoundStore(useShallow((state) => state.token))

    const boardsQuery = useQuery({
        queryKey: ['board_results', token, props],
        queryFn: async () => {
            const boardsUrl = new URL(API_ENDPOINTS.BOARDS)

            // set filters
            if (props) {
                for (const [key, value] of Object.entries(props)) {
                    if (value === undefined) continue
                    boardsUrl.searchParams.set(key, value.toString())
                }
            }

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
            
            const jsonResponse = await boardResponse.json()
            return jsonResponse.board_results
        },
    })
    
    return boardsQuery;
}