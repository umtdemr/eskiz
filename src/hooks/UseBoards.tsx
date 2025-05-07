import { API_ENDPOINTS } from "@/helpers/Constant";
import { useBoundStore } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

export function useBoards() {
    const token = useBoundStore(useShallow((state) => state.token))

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
    
    return boardsQuery;
}