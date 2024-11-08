import {Skeleton} from "@/components/ui/skeleton.tsx";

export default function BoardsListSkeleton({ count = 7 }: { count?: number }) {
    return (
        Array.from(Array(count).keys()).map(i => (
            <div key={i} className='w-[300px]'>
                <Skeleton className='w-full h-36'/>
                <Skeleton className='w-[60%] h-5 mt-5'/>
                <Skeleton className='w-[20%] h-5 mt-2'/>
            </div>
        ))
    )
}