import { Skeleton } from '@/components/ui/skeleton.tsx'

export default function SkeletonToolbar() {
    return (
        <div
            className="fixed flex gap-1 rounded p-1 bottom-2 left-1/2 -translate-x-1/2 md:flex-col md:gap-2 md:p-2 md:bottom-auto md:top-1/2 md:left-5 md:translate-x-0 md:-translate-y-1/2"
            style={{ boxShadow: '0 4px 16px 0 rgba(161 161 170 / 40%)' }}
        >
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-[0.5px] h-6 self-center mx-1 md:w-full md:h-[0.5px] md:my-5 md:mx-0" />
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-[0.5px] h-6 self-center mx-1 md:w-full md:h-[0.5px] md:my-5 md:mx-0" />
            <Skeleton className="w-8 h-8 md:h-9" />
            <Skeleton className="w-8 h-8 md:h-9" />
        </div>
    )
}
