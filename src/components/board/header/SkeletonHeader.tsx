import {Skeleton} from "@/components/ui/skeleton.tsx";

export default function SkeletonHeader() {
    return (
        <div className='flex fixed justify-between w-full p-5 top-0'>
            <div className='flex px-5 py-2 rounded-lg gap-2 items-center select-none bg-white shadow'>
                <span className='text-sm font-mono font-bold'>
                    WB
                </span>
                <div className='block w-[0.5px] h-full bg-zinc-300'></div>
                <Skeleton className='w-[98.38px] py-2' />
            </div>
            <div>
                <Skeleton className='w-5 py-3' />
            </div>
        </div>
    )
}