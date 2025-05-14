import {useRef} from "react";
import {useBoards} from "@/hooks/UseBoards.tsx";
import {BoardListWrapper} from "@/components/board/boardList/BoardListWrapper.tsx";

export function Deleted() {
    const nextPageLoaderRef = useRef<HTMLDivElement>(null);
    const boardsQuery = useBoards({ is_deleted: false, sort: '-created_at' }, nextPageLoaderRef)

    return (
        <>
            <h2 className='text-xl font-bold'>Deleted Boards</h2>
            <p className="text-slate-500">Deleted board can be restored within 30 days after deleting</p>
            <BoardListWrapper
                boardsQuery={boardsQuery}
                notFoundMessage="You don't have any deleted boards."
                className="mt-10"
                ref={nextPageLoaderRef}
            />
        </>
    )
}