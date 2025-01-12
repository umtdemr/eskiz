import {Skeleton} from "@/components/ui/skeleton.tsx";

export default function SkeletonFooter() {
    return (
        <div className='fixed flex gap-1 bottom-5 right-5 px-2 py-1' style={{ boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <Skeleton className='w-8 h-9' />
            <Skeleton className='w-11 h-9' />
            <Skeleton className='w-8 h-9' />
        </div>
    )
}