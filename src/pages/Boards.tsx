import {useBoundStore} from "@/store/store.ts";

export default function Boards() {
    const userData  = useBoundStore((state) => state.userData.email)
    return (
        <>
            here it is: { userData }
        </>
    )
}