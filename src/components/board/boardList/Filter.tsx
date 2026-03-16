import {
    Select,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectGroup,
    SelectItem,
} from '@/components/ui/select'
import { SortByFilter } from '@/hooks/UseBoards'
import { OwnedByFilter } from '@/pages/boards/Boards'

const validSortByFilterObject: Record<SortByFilter, true> = {
    '-created_at': true,
    name: true,
}

const isValueSortByFilter = (value: string): value is SortByFilter => {
    return value in validSortByFilterObject
}

export default function Filter({
    ownedByFilter,
    changeOwnedByFilter,
    sortByFilter,
    changeSortByFilter,
}: {
    ownedByFilter: OwnedByFilter
    changeOwnedByFilter: (data: OwnedByFilter) => void
    sortByFilter: SortByFilter
    changeSortByFilter: (newSortFilter: SortByFilter) => void
}) {
    const ownedByFilterValue =
        ownedByFilter?.isOwner === undefined
            ? 'anyone'
            : ownedByFilter.isOwner
              ? 'me'
              : 'not_me'

    const changeOwnedByFilterHandler = (val: string) => {
        if (val === 'anyone') {
            changeOwnedByFilter({})
            return
        }

        if (val === 'me') {
            changeOwnedByFilter({ isOwner: true })
            return
        }
        changeOwnedByFilter({ isOwner: false })
    }

    const changeSortByFilterHandler = (val: string) => {
        if (!isValueSortByFilter(val)) return

        changeSortByFilter(val)
    }

    return (
        <div className="flex gap-5 items-center">
            <div className="flex gap-2 items-center">
                <span className="text-xs">Filter by</span>
                <Select
                    value={ownedByFilterValue}
                    onValueChange={changeOwnedByFilterHandler}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Owned by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="anyone">
                                Owned by anyone
                            </SelectItem>
                            <SelectItem value="me">Owned by me</SelectItem>
                            <SelectItem value="not_me">
                                Owned by someone else
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 items-center">
                <span className="text-xs">Sort by</span>
                <Select
                    value={sortByFilter}
                    onValueChange={changeSortByFilterHandler}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="-created_at">
                                Latest created
                            </SelectItem>
                            <SelectItem value="name">Alphabetically</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
