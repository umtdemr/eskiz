import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";

export default function BoardsPage() {
    const user = useBoundStore(useShallow((state) => state.userData))
    return (
        <span>Welcome {user.full_name}</span>
    )
}