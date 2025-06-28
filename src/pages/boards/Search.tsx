import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBoards } from '@/hooks/UseBoards'
import { BoardListWrapper } from '@/components/board/boardList/BoardListWrapper.tsx'

export default function Search() {
    const [name, setName] = useState('')
    const [nameFilter, setNameFilter] = useState('')
    const setFilterTimeout = useRef<NodeJS.Timeout>()
    const nextPageLoaderRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        clearTimeout(setFilterTimeout.current)

        setFilterTimeout.current = setTimeout(() => {
            setNameFilter(name)
        }, 200)
    }, [name])

    const boardsQuery = useBoards(
        { name: nameFilter, sort: '-created_at' },
        nextPageLoaderRef,
    )
    return (
        <>
            <h2 className="text-xl font-bold">Search</h2>
            <div className="mt-5">
                <Label htmlFor="search_input" className="font-bold text-xs">
                    Search in boards
                </Label>
                <Input
                    id="search_input"
                    placeholder="Search boards"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <BoardListWrapper
                boardsQuery={boardsQuery}
                notFoundMessage="We couldn't find any boards based on your search. Please try again with different filter."
                errorMessage="We couldn't load the boards. Try again later."
                className="mt-10"
                ref={nextPageLoaderRef}
            />
        </>
    )
}
