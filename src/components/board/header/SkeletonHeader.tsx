import {Skeleton} from "@/components/ui/skeleton.tsx";

export default function SkeletonHeader() {
    return (
        <>
            <div
                className='fixed top-5 left-5'
                id='header_left'>
                <div className='flex px-5 py-2 rounded-lg gap-2 items-center select-none bg-white shadow'>
                <span className='text-sm font-mono font-bold'>
                    WB
                </span>
                    <div className='block w-[0.5px] h-full bg-zinc-300'></div>
                    <Skeleton className='w-[98.38px] py-2' />
                </div>
            </div>
            <div className='fixed top-5 right-5 flex bg-white shadow px-2 py-2 rounded-xl h-12 items-center gap-2'>
                <Skeleton className='w-32 py-4' />
            </div>
        </>
    )
}