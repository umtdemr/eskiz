import {LoaderCircle, MousePointer2} from "lucide-react";
import BoardsListSkeleton from "@/components/board/boardList/BoardsListSkeleton.tsx";
import {BoardList} from "@/components/board/boardList/BoardList.tsx";
import {InfiniteData, UseInfiniteQueryResult} from "@tanstack/react-query";
import {BoardsWithPagination} from "@/types/Board.ts";
import {clsx} from "clsx";
import {ForwardedRef, forwardRef} from "react";

type BoardListWrapperProps = {
    boardsQuery: UseInfiniteQueryResult<InfiniteData<BoardsWithPagination>>
    notFoundMessage?: string;
    errorMessage?: string;
    className?: string;
}

export const BoardListWrapper = forwardRef(function BoardListWrapper({
     boardsQuery,
     notFoundMessage = "You don't have any board. Create one.",
     errorMessage = "We couldn't load the boards. Try again later.",
     className = "We couldn't load the boards. Try again later."
}: BoardListWrapperProps, ref: ForwardedRef<HTMLDivElement>){
    return (
        <>
        <div className={clsx('flex flex-wrap gap-x-5 gap-y-10', className)}>
            {
                boardsQuery.isError ? (
                    <div
                        className='w-full relative flex h-40'
                        style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                        <div className='w-full flex justify-center items-center'>
                            <span className='border-2 p-2 border-blue-200 font-mono text-sm'>
                                { errorMessage }
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
                    boardsQuery.data.pages[0]?.board_results?.length ? boardsQuery.data.pages.map(page => (
                        <BoardList boards={page.board_results} key={page.metadata.current_page} />
                    )) : <div
                            className='w-full relative flex h-40'
                            style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                            <div className='w-full flex justify-center items-center'>
                                <span className='border-2 p-2 border-blue-200 font-mono text-sm'>
                                    { notFoundMessage }
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
        <div className='relative'>
            {
                boardsQuery.hasNextPage && (
                    <div ref={ref} className='absolute bg-transparent top-[-230px] h-[230px] w-full z-[-1]' ></div>
                )
            }
        </div>

        {/* Loading */}
        {
            boardsQuery.isFetchingNextPage && (
                <div className='flex justify-center py-10'>
                    <LoaderCircle
                        className='animate-spin'
                        role="progressbar"
                        aria-busy="true"
                        aria-label="Loading next boards"
                    />
                </div>
            )
        }
        </>
    )
})