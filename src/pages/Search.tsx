import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoards } from "@/hooks/UseBoards";
import { MousePointer2 } from "lucide-react";
import BoardsListSkeleton from "@/components/board/boardList/BoardsListSkeleton";
import { BoardList } from "@/components/board/boardList/BoardList";

export default function Search() {
    const [name, setName] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const setFilterTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        clearTimeout(setFilterTimeout.current);

        setFilterTimeout.current = setTimeout(() => {
            setNameFilter(name)
        }, 200)
    }, [name])

    const boardsQuery = useBoards({ name: nameFilter, sort: '-created_at' })
    return (
        <>
            <h2 className='text-xl font-bold'>Search</h2>
            <div className="mt-5">
                <Label htmlFor="search_input" className="font-bold text-xs">Search in boards</Label>
                <Input id="search_input" placeholder="Search boards" value={name} onChange={(e) => setName(e.target.value)} />
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
                                                We couldn't find any boards based on your search. Please try again with different filter.
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
        </>
    )
}