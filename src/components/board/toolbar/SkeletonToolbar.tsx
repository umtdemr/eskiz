import {Skeleton} from "@/components/ui/skeleton.tsx";

export default function SkeletonToolbar() {
    return (
        <div className='fixed flex gap-2 flex-col rounded p-2 top-[50%] left-5' style={{ transform: 'translateY(-50%)', boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}>
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-full h-[0.5px] my-5' />
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-full h-[0.5px] my-5' />
            <Skeleton className='w-8 h-9'/>
            <Skeleton className='w-8 h-9'/>
        </div>
    )
}