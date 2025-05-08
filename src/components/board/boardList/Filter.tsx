import { Select, SelectValue, SelectTrigger, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { OwnedByFilter } from "@/pages/Boards";

export default function Filter({ ownedByFilter, changeOwnedByFilter }: {ownedByFilter: OwnedByFilter, changeOwnedByFilter: (data: OwnedByFilter) => void}) {
    const ownedByFilterValue = ownedByFilter?.isOwner === undefined ? 'anyone'
        : ownedByFilter.isOwner ? 'me' : 'not_me'

    const changeOwnedByFilterHandler = (val: string) => {
        if (val === 'anyone') {
            changeOwnedByFilter({ })
            return
        }

        if (val === 'me') {
            changeOwnedByFilter({ isOwner: true })
            return
        }
        changeOwnedByFilter({ isOwner: false })
    }
    
    return (
        <div className="flex gap-5 items-center">
            <div className="flex gap-2 items-center">
                <span className="text-xs">Filter by</span>
                <Select value={ownedByFilterValue} onValueChange={changeOwnedByFilterHandler}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Owned by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="anyone">Owned by anyone</SelectItem>
                            <SelectItem value="me">Owned by me</SelectItem>
                            <SelectItem value="not_me">Owned by someone else</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}